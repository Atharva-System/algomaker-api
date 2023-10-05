import Zerodha from '../lib/Zerodha';
import * as optionsConfig from '../tools/optionInstruments';
import KiteTicker from '../lib/KiteTicker';
import { OptionData, Tick } from '../interface/interface';
import mongoose from 'mongoose';
import { AccountsService } from '@src/modules/accounts/accounts.service';
import async from 'async';
import { Orderbook } from '@src/modules/orderbook/orderbook.schema';
import { OrderbookService } from '@src/modules/orderbook/ordebook.service';
import { PaperTradeService } from '@src/modules/papertrade/papertrade.service';
import { INestApplication } from '@nestjs/common';
import { SocketGateway } from '@src/common/gateways/socket/socket.gateway';
import { Account, AccountSchema } from '@src/modules/accounts/accounts.schema';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { strategy20 } from '@src/strategy/strangle_st20';
import { initM2Mlogger } from '../tools/m2mLogger';

let public_token: string, liveFeed: any, base_account: Account;
const masterId = process.env.masterId;
// const ticksCache = {};
// const slippage = 0;
const ticksCacheFrontend = {};
const realTimeTicker = {};
// const rejectedOrders = [];
// const cancelledOrders = [];
let socket: SocketGateway;
let papertradeService: PaperTradeService;

async function ticker(underlying: string, subs: number[]) {
  liveFeed = new KiteTicker({
    access_token: public_token,
  });
  liveFeed.connect();
  liveFeed.on('ticks', function (ticks: Tick[]) {
    //here we will get live ticks and it might be stop around 7:00 pm
    storeTicks(ticks);
  });

  liveFeed.on('connect', function () {
    console.log(`PT: ${underlying} Live Feed Connected`);
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

function storeTicks(ticks: Tick[]) {
  const ticks3 = {};
  for (const el of ticks) {
    const instrument_token = el.instrument_token;
    ticks3[instrument_token] = el.last_price;
  }
  Object.assign(ticksCacheFrontend, ticks3);
  realTimeTicker['nifty'] = ticks3['256265'];
  realTimeTicker['bank_nifty'] = ticks3['260105'];

  socket.server.emit('ticks', realTimeTicker);
  sendUpdate(papertradeService, ticks3); // this is totally dependent on ticks
}

function sendUpdatePnl(orderbookService: OrderbookService, accountsService: AccountsService) {
  console.log("sendUpdatePnl called")
  accountsService.all_positions(true, function (err: any, resp: async.IterableCollection<Orderbook>) {
    // const currentRejectedOrders = [];
    // const currentCancelledOrders = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async.eachLimit(resp, 5, function (accountPosition: Orderbook, cb) {
      // const accountRejectedOrders = accountPosition.orders.filter(c => c.status == 'REJECTED' || c.status == 'Rejected');
      // const accountCancelledOrders = accountPosition.orders.filter(c => c.status == 'CANCELLED' || c.status == 'Cancelled');

      // accountRejectedOrders.forEach(c => (c.accountId = accountPosition.accountId));
      // accountCancelledOrders.forEach(c => (c.accountId = accountPosition.accountId));
      // currentRejectedOrders.push(...accountRejectedOrders);
      // currentCancelledOrders.push(...accountCancelledOrders);;
      orderbookService.upsertAccountPosition({
        createdAt: accountPosition.createdAt,
        accountId: accountPosition.accountId
      }, accountPosition);
    }, function () {
      // let msgtext2 = '';
      // let msgtext = '';

      // async.eachSeries(currentCancelledOrders, function (order, cb) {
      //   (async () => {
      //     if (cancelledOrders.indexOf(order.order_id) == -1) {
      //       msgtext2 += `${order.placed_by} - ${order.tag} - ${order.status_message_raw == '17070 : The Price is out of the current execution range' ? 'Option Freeze' : order.status_message}\n`;
      //       cancelledOrders.push(order.order_id);
      //       setTimeout(function () {
      //         AccountsService.orderFNO(String(order.accountId), {
      //           "tradingsymbol": order.tradingsymbol,
      //           "transaction_type": order.transaction_type,
      //           "order_type": "MARKET",
      //           "quantity": order.quantity,
      //           "trigger_price": 0,
      //           "price": 0,
      //           "tag": order.tag
      //         }, function (err, order_resp) {
      //           console.log(order_resp);
      //         });
      //         setTimeout(() => {
      //           sendUpdatePnl(orderbookService);
      //         }, 3000);
      //       }, 5000);
      //       cb();
      //     } else cb();
      //   })()
      // }, function () {
      //   if (msgtext2.length > 0) {
      //     console.log(msgtext2,'msgtext2 notify');
      //     // notify(msgtext2, 0);
      //   }
      //   fs.writeFileSync('cancelledOrders.json', JSON.stringify(cancelledOrders));
      // });
      // async.eachSeries(currentRejectedOrders, function (order, cb) {
      //   if (rejectedOrders.indexOf(order.order_id) == -1) {
      //     msgtext += `${order.placed_by} - ${order.tag} - ${order.status_message.indexOf('Insufficient funds') != -1 ? 'Insufficient funds' : order.status_message}\n`;
      //     rejectedOrders.push(order.order_id);
      //     // closePositions(zapi_n, cb2, strategy)
      //     AccountsService.squareOff(String(order.accountId), {
      //       accessToken: {
      //         userId: "sysadmin"
      //       }
      //     }, function () {
      //       console.log('rejection sqf done', order);
      //     });
      //     // Account.findOne({
      //     //   where: {
      //     //     name: order.placed_by
      //     //   }
      //     // }, function (err, acc) {
      //     //   if (acc) {
      //     //     try {
      //     //       if (acc.strategy) {
      //     //         if (typeof acc.bkp_strategy != 'object') acc.bkp_strategy = {};
      //     //         let runningQty = parseInt(acc.strategy[order.tag]);
      //     //         if (runningQty > 0) {
      //     //           acc.bkp_strategy[order.tag] = runningQty;
      //     //           acc.strategy[order.tag] = 0;
      //     //         }
      //     //       }
      //     //       acc.save(cb);
      //     //     } catch (err) {
      //     //       console.log(err);
      //     //       cb();
      //     //     }
      //     //   } else cb();
      //     // });
      //   } else cb();
      // }, function () {
      //   if (msgtext.length > 0) {
      //     notify(msgtext, 0);
      //   }
      //   fs.writeFileSync('rejectedOrders.json', JSON.stringify(rejectedOrders));
      // });
      // console.log('Positions Saved!');
      // console.log("positions-update", true);
    });
  });
}

let cachedPositions = null;
async function sendUpdate(paperTradeService: PaperTradeService, instrument_ltp: object) {
  try {
    console.log('sendUpdate called=====')
    if (!cachedPositions) {
      cachedPositions = await new Promise((resolve, reject) => {
        paperTradeService.positions((err: any, resp: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(resp);
          }
        });
      });
    }
    const accounts: any[] = cachedPositions.accounts
    let total_pnl = 0;
    function updatePositionsPNL(instrument_ltp: object) {
      return new Promise((resolve) => {
        accounts.forEach(function (account, idx) {
          let total_m2m = 0;
          accounts[idx].positions.forEach(function (position) {
            if (instrument_ltp[position.instrument_token]) {
              if (position.quantity > 0) {
                position.m2m = ((position.sell_price * position.sell_quantity) + (Math.abs(position.quantity) * instrument_ltp[position.instrument_token])) - (position.buy_price * position.buy_quantity);
                position.ltp = +instrument_ltp[position.instrument_token].toFixed(2);
              } else if (position.quantity < 0) {
                console.log(instrument_ltp[position.instrument_token]);
                position.m2m = (position.sell_price * position.sell_quantity) - ((position.buy_price * position.buy_quantity) + (Math.abs(position.quantity) * instrument_ltp[position.instrument_token]));
                position.ltp = +instrument_ltp[position.instrument_token].toFixed(2);
              }
            }
            total_m2m += position.m2m;
          });
          accounts[idx].total = +total_m2m.toFixed(2);
          accounts[idx].totalAbs = Math.abs(accounts[idx].total);
          total_pnl = total_pnl + total_m2m;
          resolve(accounts)
        });
      })
    }
    updatePositionsPNL(instrument_ltp).then((totalPNL) => {
      socket.server.emit('paper-update', totalPNL);
    })

  } catch (error) {
    console.error("Error fetching positions:", error);
  }
}

export async function startSocket(app: INestApplication) {
  const orderbookService = app.get(OrderbookService)
  const accountsService = app.get(AccountsService)
  const paperTradeService = app.get(PaperTradeService)
  const socketGateway = app.get(SocketGateway);
  socket = socketGateway
  papertradeService = paperTradeService

  const AccountModel = mongoose.model('account', AccountSchema);
  base_account = await AccountModel.findById(masterId);
  console.log('bootstrap initiated');
  const zapi_base = new Zerodha(base_account);
  zapi_base.loadConfig(base_account);
  await zapi_base.login();
  public_token = await zapi_base.getAuthorization();
  console.log(public_token);

  const optionData: OptionData = await optionsConfig.download('BANKNIFTY');
  const futureToken = optionData.currentFuture.token;
  const currentExpiryOptions = optionData.weeklyInstruments;
  const b_currentExpiryOptions = optionData.nextWeekInstruments;
  const optionTokens = Object.values(currentExpiryOptions).map((c) => c.instrument_token);
  const b_optionTokens = Object.values(b_currentExpiryOptions).map((c) => c.instrument_token);
  await ticker('BANKNIFTY', [256265, 260105, futureToken, ...optionTokens, ...b_optionTokens]);

  const n_optionData: OptionData = await optionsConfig.download('NIFTY');
  const n_futureToken = n_optionData.currentFuture.token;
  const n_currentExpiryOptions = n_optionData.weeklyInstruments;
  const n_nextWeekExpiryOptions = n_optionData.nextWeekInstruments;
  const n_optionTokens = Object.values(n_currentExpiryOptions).map((c) => c.instrument_token);
  const n_nextWeekOptionTokens = Object.values(n_nextWeekExpiryOptions).map((c) => c.instrument_token);

  await ticker('NIFTY', [n_futureToken, ...n_optionTokens, ...n_nextWeekOptionTokens]);

  setInterval(async () => {
    try {
      sendUpdatePnl(orderbookService, accountsService)
      sendUpdate(paperTradeService, ticksCacheFrontend)
      // initM2Mlogger();
    } catch (error) {
      console.error('Error:', error);
    }
  }, 3000);

  setTimeout(() => {
    // strategy20();
    initM2Mlogger();
  }, 3000);
}