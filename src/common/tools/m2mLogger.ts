import { CronJob } from 'cron'
import 'dotenv/config';
import KiteTicker from '../lib/KiteTicker';
import Zerodha from '../lib/Zerodha';
import { Account, AccountSchema } from '@src/modules/accounts/accounts.schema';
import mongoose from 'mongoose';
import { PaperTradeDocument, PaperTradeSchema } from '@src/modules/papertrade/papertrade.schema';
import { PaperTradeService } from '@src/modules/papertrade/papertrade.service';
import { StrategyPNLDocument, StrategyPNLSchema } from '@src/modules/strategyPNL/strategyPNL.schema';
import { StrategyPNLService } from '@src/modules/strategyPNL/strategyPNL.service';
import { ReportDocument, ReportSchema } from '@src/modules/report/report.schema';
import { ReportService } from '@src/modules/report/report.service';

const paperTradeModel = mongoose.model<PaperTradeDocument>('paper-trade', PaperTradeSchema);
const paperTradeService = new PaperTradeService(paperTradeModel);
const strategyPNLModel = mongoose.model<StrategyPNLDocument>('strategyPNL', StrategyPNLSchema);
const strategyPNLService = new StrategyPNLService(strategyPNLModel);
const reportModel = mongoose.model<ReportDocument>('report', ReportSchema);
const reportService = new ReportService(reportModel);

// const paperTradeService: PaperTradeService = new PaperTradeService(getModelToken(PaperTrade.name) as unknown as Model<PaperTradeDocument>);
// const strategyPNLService: StrategyPNLService = new StrategyPNLService(getModelToken(StrategyPNL.name) as unknown as Model<StrategyPNLDocument>);

let connected = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let zapi: boolean | Zerodha;
let public_token: any, liveFeed: any;
const masterId = process.env.masterId;


async function zerodha_init(account: Account) {
  const zapi_n = new Zerodha(account);
  zapi_n.loadConfig(account);
  const login_resp = await zapi_n.login();
  account.lastLogin = (new Date()).toISOString().substr(0, 10);
  // account.config = await zapi_n.getConfig();
  public_token = zapi_n.getAuthorization();
  await account.save();
  if (login_resp === false) return false;
  else return zapi_n;
}

async function ticker() {
  liveFeed = new KiteTicker({
    api_key: 'kitefront',
    access_token: public_token
  });
  liveFeed.connect();
  liveFeed.on("ticks", checkTicks);
  liveFeed.on("connect", function () {
    console.log('Live Feed Connected');
    connected = true;
    liveFeed.subscribe(alreadySubscribed);
    liveFeed.setMode(liveFeed.modeFull, alreadySubscribed);
  });
}
const alreadySubscribed = [];
async function subs(subscribeInstruments) {
  do {
    if (connected) {
      subscribeInstruments = Array.from(new Set(subscribeInstruments));
      subscribeInstruments = subscribeInstruments.filter(c => alreadySubscribed.indexOf(c) == -1);
      if (subscribeInstruments.length > 0) {
        console.log('subscribing', subscribeInstruments);
        liveFeed.subscribe(subscribeInstruments);
        liveFeed.setMode(liveFeed.modeFull, subscribeInstruments);
        alreadySubscribed.push(...subscribeInstruments);
        subscribeInstruments = [];
      }
    }
  } while (subscribeInstruments.length != 0);
}
const ticksCache = {};
async function checkTicks(ticks) {
  ticks = ticks.reduce(function (ob, el) {
    ob[el.instrument_token] = el;
    return ob;
  }, {});

  Object.assign(ticksCache, ticks);
}
let positions = {
  accounts: []
};
async function init() {
  console.log('M2m logger started')
  const AccountModel = mongoose.model('account', AccountSchema);
  const base_acc: Account = await AccountModel.findById(masterId);
  zapi = await zerodha_init(base_acc);

  ticker();
  // await saveDayPNL();
  new CronJob('5,25,45 * * * * 1-5', fetchPositions, null, true, 'Asia/Kolkata');
  new CronJob('*/30 * * * * 1-5', savePNL, null, true, 'Asia/Kolkata'); //every 10th sec
  // savePNL();
}

async function calcPNL(positionCheck = false) {
  // console.log(positionCheck, 'position cheki at start')
  // console.log(positions, 'positons')
  let records = positions.accounts.map(function (account, idx) {
    let total_m2m = 0;
    let positionOpen = false;
    const openLots = {
      CE: 0,
      PE: 0
    };
    // console.log(records, ' records=====++++++===')
    positions.accounts[idx].positions.map(function (position) {
      // console.log(position, 'position')
      if (position.quantity != 0) positionOpen = true;
      if (ticksCache[position.instrument_token]) {
        if (position.quantity > 0) {
          position.m2m = ((position.sell_price * position.sell_quantity) + (Math.abs(position.quantity) * ticksCache[position.instrument_token].last_price)) - (position.buy_price * position.buy_quantity);
        } else if (position.quantity < 0) {
          position.m2m = (position.sell_price * position.sell_quantity) - ((position.buy_price * position.buy_quantity) + (Math.abs(position.quantity) * ticksCache[position.instrument_token].last_price));
        }
      }
      if (position.tradingsymbol.substr(-2) == 'CE') openLots.CE += position.quantity;
      else if (position.tradingsymbol.substr(-2) == 'PE') openLots.PE += position.quantity;
      total_m2m += position.m2m;
    });
    positions.accounts[idx].total = total_m2m;
    positions.accounts[idx].totalAbs = Math.abs(positions.accounts[idx].total);
    // console.log({
    //   strategy: account.accountId,
    //   m2m: total_m2m,
    //   open: openLots,
    //   ts: new Date()
    // })
    // console.log(positionCheck, 'positon check +++++')
    return positionCheck || positionOpen ? {
      strategy: account.accountId,
      m2m: total_m2m,
      open: openLots,
      ts: new Date()
    } : positionOpen;
  });
  // records = records.filter(c => c.m2m && c.m2m != 0);
  // console.log(records,'abbove filter');
  records = records.filter(c => c !== false && (c.m2m && c.m2m !== 0));
  return records;
}

async function savePNL() {
  const records = await calcPNL();
  // console.log(records, 'savepnl');
  if (records.length > 0) await strategyPNLService.create(records);
  // saveDayPNL();
}

async function saveDayPNL() {
  // await fetchPositions();

  const todayDate = new Date();
  todayDate.setHours(0);
  todayDate.setMilliseconds(0);
  todayDate.setMinutes(0);
  todayDate.setSeconds(0);

  const records = await calcPNL(true);
  // console.log(records, 'saveDayPNL');
  const daily_report = records.map(c => {
    if (c !== false) {
      // console.log({
      //   clientCode: c.strategy,
      //   platform: 'paper',
      //   strategy: c.strategy,
      //   pnl: c.m2m,
      //   ts: todayDate
      // })
      return {
        clientCode: c.strategy,
        platform: 'paper',
        strategy: c.strategy,
        pnl: c.m2m,
        ts: todayDate
      }
    }
  });
  // console.log(daily_report, 'daily_report');
  reportService.create(daily_report).then(() => {
    console.log('daily report saved');
  })
}

async function fetchPositions() {
  paperTradeService.positions(function (err, resp) {
    positions = resp;
    const order_tokens = Object.values(resp.orders).reduce((allTokens: any[], orders: any[]) => {
      const tmp = orders.reduce((tokens, order) => {
        tokens.push(order.instrument_token);
        return tokens;
      }, []);
      allTokens.push(...tmp);
      return allTokens;
    }, []);

    subs(order_tokens);
  });
}

export function initM2Mlogger() {
  // setInterval(() => {
  init();
  // }, 5000)
}

new CronJob('0 15 9 * * 1-5', init, null, true, 'Asia/Kolkata');
new CronJob('50 29 15 * * 1-5', function () {
  saveDayPNL();
  setTimeout(process.exit, 6000);
}, null, true, 'Asia/Kolkata');
