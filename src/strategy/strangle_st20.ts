/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import KiteTicker from '../common/lib/KiteTicker';
import Zerodha from '../common/lib/Zerodha';
import * as optionsConfig from '../common/tools/optionInstruments';
import { Account, AccountSchema, AccountDocument } from '../modules/accounts/accounts.schema';
import * as mongoose from 'mongoose';
import { Tick } from '@src/common/interface/interface';
import { CronJob } from 'cron'
import * as moment from 'moment';
import { AccountsService } from '@src/modules/accounts/accounts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
const strategyTag = 'STG5';

let zapi: boolean | Zerodha;
let public_token: any, liveFeed: any;
const accountsService: AccountsService = new AccountsService(getModelToken(Account.name) as unknown as Model<AccountDocument>);
// let accountsService: AccountsService
const masterId = process.env.masterId;
const ticksCache = {};

async function zerodha_init(account: Account) {
  const zapi_n = new Zerodha(account);
  // zapi_n.loadConfig(account);
  const login_resp = await zapi_n.login();
  account.lastLogin = (new Date()).toISOString().substr(0, 10);
  // account.config = await zapi_n.getConfig();
  public_token = zapi_n.getAuthorization();
  await account.save();
  if (login_resp === false) return false;
  else return zapi_n;
}

async function checkTicks(ticks: any[]) {
  ticks = ticks.reduce(function (ob: { [x: string]: any; }, el: { instrument_token: string | number; }) {
    ob[el.instrument_token] = el;
    return ob;
  }, {});
  Object.assign(ticksCache, ticks);
}

async function ticker(subs: number[]) {
  liveFeed = new KiteTicker({
    access_token: public_token,
  });
  liveFeed.connect();
  liveFeed.on('ticks', async function (ticks: Tick[]) {
    //here we will get live ticks and it might be stop around 7:00 pm
    checkTicks(ticks);
  });

  liveFeed.on('connect', function () {
    console.log('Live Feed Connected');
    liveFeed.subscribe(subs);
    liveFeed.setMode(liveFeed.modeFull, subs);
  });

  liveFeed.on('reconnect', function () {
    console.log('reconnect');
  });
  liveFeed.on('error', function (error: any) {
    console.error('Error:', error);
  });
}

let accounts = [],
  running_accounts = [],
  account_quantities = {},
  firstRun = true;
async function getAccounts() {
  await mongoose.connect('mongodb://localhost:27017/algo_20_07_2023', {
    bufferCommands: false,
    connectTimeoutMS: 30000,
  })
  const accountsData = await accountsService.loadAccounts(strategyTag, firstRun);
  console.log(accountsData);
  accounts = accountsData.accounts;
  account_quantities = accountsData.account_quantities;
  if (firstRun) {
    running_accounts = accountsData.running_accounts;
    firstRun = false;
  }
}

// eslint-disable-next-line prefer-const
let futureToken: string | number, currentExpiryOptions = {}, strategy_running = true;
async function runStrategy() {
  try {
    console.log('Run Strategy------')
    const optionData = await optionsConfig.config();
    futureToken = 260105;
    currentExpiryOptions = optionData.weeklyInstruments;

    const optionTokens = (Object.values(currentExpiryOptions) as Array<{ instrument_token: number }>).map(c => c.instrument_token);
    await getAccounts();
    const AccountModel = mongoose.model('account', AccountSchema);
    const base_acc: Account = await AccountModel.findById(masterId);
    zapi = await zerodha_init(base_acc);
    ticker([futureToken, ...optionTokens]);

    // new CronJob('30 * * * * 1-5', getAccounts, null, true, 'Asia/Kolkata');
    setTimeout(() => {
      console.log(account_quantities, 'accountqu');
      check()
    }, 4000)
    // new CronJob('0 */3 * * * 1-5', check, null, true, 'Asia/Kolkata');
  } catch (err) {
    console.log(err, 'runstartegy');
  }
}

let currentPosition = false,
  instrument_CE, instrument_PE,
  entry, stoploss, trail;
async function check() {
  if (strategy_running) {
    console.log('inside check')
    let bn_quote;
    let checkQuote_attempt = 10;
    do {
      try {
        checkQuote_attempt--;
        bn_quote = ticksCache[futureToken];

        if (bn_quote && typeof bn_quote == 'object' && bn_quote.last_price) {
          console.log('inside bn_quote && typeof  && bn_quote.last_price ')
          let upper_strike: any = (Math.round(bn_quote.last_price / 100) * 100);
          let lower_strike: any = (Math.round(bn_quote.last_price / 100) * 100);
          upper_strike = currentExpiryOptions[upper_strike + "CE"];
          lower_strike = currentExpiryOptions[lower_strike + "PE"];

          if (currentPosition) {
            console.log('inisde current postion')
            upper_strike = instrument_CE;
            lower_strike = instrument_PE;
          }

          const price_ce = ticksCache[upper_strike.instrument_token].last_price;
          const price_pe = ticksCache[lower_strike.instrument_token].last_price;
          const combine_premium = Math.round(price_ce + price_pe);

          console.log(moment().format('HH:mm'), lower_strike.strike, bn_quote.last_price);
          console.log(combine_premium, stoploss, entry, trail, currentPosition);

          if (!currentPosition) {
            console.log('!currentPPOSitons')
            instrument_CE = upper_strike;
            instrument_PE = lower_strike;
            currentPosition = true;
            accountsService.placeAllAccount(strategyTag, account_quantities, running_accounts, instrument_CE, 'SELL');
            accountsService.placeAllAccount(strategyTag, account_quantities, running_accounts, instrument_PE, 'SELL');
            stoploss = Math.round(combine_premium * 1.1);
            trail = 0;
            entry = combine_premium;
          } else {
            console.log('yes current positions')
            if (combine_premium >= stoploss) {
              accountsService.placeAllAccount(strategyTag, account_quantities, running_accounts, instrument_CE, 'BUY');
              accountsService.placeAllAccount(strategyTag, account_quantities, running_accounts, instrument_PE, 'BUY');
              currentPosition = false;
            } else {
              const n_trail = (entry - combine_premium);
              if (n_trail > trail) {
                stoploss = stoploss - (n_trail - trail);
                trail = n_trail;
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
        if (zapi instanceof Zerodha) {
          await zapi.login();
        }
      }
    } while (typeof bn_quote != 'object' && checkQuote_attempt > 0);
  }
}

// runStrategy();

export function strategy20() {
  runStrategy();
}
// new CronJob('30 16 9 * * 1-5', runStrategy, null, true, 'Asia/Kolkata');
// new CronJob('0 28 15 * * 1-5', async function () {
//   strategy_running = false;
// }, null, true, 'Asia/Kolkata');
// new CronJob('30 30 15 * * 1-5', function () {
//   process.exit();
// }, null, true, 'Asia/Kolkata');