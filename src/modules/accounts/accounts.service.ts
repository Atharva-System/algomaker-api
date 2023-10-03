import mongoose, { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument, AccountSchema } from './accounts.schema';
import Zerodha from '@src/common/lib/Zerodha';
import * as async from 'async'
import * as moment from 'moment'
import { PaperTradeSchema } from '../papertrade/papertrade.schema';
const tranches = (number: number, chunkSize: number) => ((new Array(Math.floor(number / chunkSize)).fill(chunkSize).concat(number % chunkSize)).filter(c => c > 0));

@Injectable()
export class AccountsService {
  constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>) { }

  async findById(id: string): Promise<Account | null> {
    try {
      const account = await this.accountModel.findById(id).exec();
      if (!account) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }
      return account;
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  private static strategies = ['AlgoEQ', 'Index', 'Index_Old', 'Bentley', 'RollsRoyce', 'Birbal_AI', 'Casino', 'Tesla', 'TR', 'Pi', 'ITCRT', 'LX1', 'LX2', 'LX3', 'LX4', 'STG3', 'STG4', 'Chai', 'Spider', 'F2', 'ST1', 'BTS', 'BBT', 'BBT5', 'BBTn5', 'iStraddle', 'Strangle', 'mStrangle', 'nStrangle', 'uStrangle', 'LowRisk', 'mLowRisk', 'uLowRisk', 'Joker', 'Math_AI', 'Index', 'Index_Old', 'AlgoEQ', 'Bahubali', 'Birbal_AI', 'Birbal_LMT', 'Casino', 'Tesla', 'Pi', 'ITC', 'ITCRT', 'Chai', 'Spider', 'F2', 'ST1', 'S1', 'BTS', 'BBT', 'BBTn5', 'BBT5', 'Urvashi', 'Strangle', 'mStrangle', 'nStrangle', 'uStrangle', 'LowRisk', 'mLowRisk', 'uLowRisk', 'Joker', 'mStrangleT', 'uStrangleT', 'Strangle40', 'Strangle60', 'ADMIN_SQF', 'SQF', "STG1", "STG2", "STG3", "STG4", "STG5", "STG6", "STG7", "STG8", "STG9", "STG10", "STG11", "STG12", "STG13", "STG14", "STG15", "STG16", "STG17", "STG18", "STG19", "STG20", "STG21", "STG22", "STG23", "MTM_1", "STGL-120", "STGL-160", "Strangle240", 'Strangle2k', 'MB-2k', "MB-N700", "MB-10", "AudiB1", "AudiB2", "AudiB3", "AudiB4", "AudiN1", "AudiN2", "AudiT60", "AudiTT", "AudiTT2", "Banknifty12", "Nifty12", "Ford", "Ford2", "Ford3", 'AudiT80R', 'AudiT120R', 'AudiB80R', 'AudiB120R', 'B5', 'B4', 'T4', 'T3', 'Volvo', 'Volvo2', "TWS", "TWSn", 'V1', 'V2', 'Hedge', 'Super20', 'Honda2k', 'S4', "AudiPC-800", "AudiPS-600"];
  private static allStrategies = Array.from(new Set(AccountsService.strategies));

  async check(account: Account) {
    try {
      const zapi_n = new Zerodha(account);
      zapi_n.loadConfig(account);
      const session = await zapi_n.login();
      if (session) {
        const profile = await zapi_n.getConfig();
        const margins = await zapi_n.margins();
        return {
          status: true,
          message: 'login success',
          profile,
          margins,
        };
      } else {
        return {
          status: false,
          message: 'login failed',
        };
      }
    } catch (err) {
      return {
        status: false,
        message: 'something went wrong: ' + err.toString(),
      };
    }
  }

  async zerodha_init(account: Account) {
    const zapi_n = new Zerodha(account);
    zapi_n.loadConfig(account);
    const login_resp = await zapi_n.login();
    if (login_resp === false) return false;
    else return zapi_n;
  }

  async loadAccounts(strategyTag: string, loginAccounts = false): Promise<{ accounts: any[], account_quantities: Record<string, number>, running_accounts?: any[] }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise(async (resolve, reject) => {
      const running_accounts = [];
      const AccountModel = mongoose.model('account', AccountSchema)
      const accounts = await AccountModel.find({});
      const account_quantities = accounts.reduce((lotSize, elm) => {
        if (elm.strategy && elm.strategy[strategyTag]) {
          lotSize[elm.name] = parseInt(String(elm.strategy[strategyTag]));
        }
        return lotSize;
      }, {});
      const combineTotalLots: number = Object.values<number>(account_quantities).reduce((s, a) => (s += a, s), 0);
      if (loginAccounts) {
        async.eachLimit(accounts, 3, function (account: Account, cb) {
          this.zerodha_init(account).then(tmp_zapi => {
            if (tmp_zapi) running_accounts.push(tmp_zapi);
            cb();
          });
        }, function () {
          if (combineTotalLots > 0) {
            // notify(running_accounts.length + ' accounts logged in, total ' + strategyTag + ': ' + combineTotalLots + ' lots', channelId);
          }
          resolve({
            accounts,
            account_quantities,
            running_accounts
          });
        });
      } else {
        resolve({
          accounts,
          account_quantities
        });
      }
    })
  }

  async trackOrder(optionInstrument: any, orderType: string, strategyTag: string, multiplier = 1) {
    console.log("FINALYY IT WORKED (track order)+++++++++$$$$$$$$$$$$$$$$$$$$$$")
    const PaperTradeModel = mongoose.model('paper-trade', PaperTradeSchema);
    PaperTradeModel.create({
      "status": "COMPLETE",
      "order_timestamp": new Date(moment().toDate()),
      "exchange": "NFO",
      "tradingsymbol": optionInstrument.tradingsymbol,
      "instrument_token": optionInstrument.instrument_token,
      "order_type": "MARKET",
      "transaction_type": orderType,
      "quantity": optionInstrument.lot_size * multiplier,
      // "average_price": instrument_quote.last_price,
      "filled_quantity": optionInstrument.lot_size * multiplier,
      "tag": strategyTag,
    });
  }

  async placeOrder(strategyTag: string, tmp_zapi: any, optionInstrument: any, orderType: string, lot_size = 1, mcb: any) {
    try {
      await tmp_zapi.login();
      console.time('Order' + strategyTag + "_" + tmp_zapi.credentials.user_id);
      const firstLegOrder = await tmp_zapi.orderFNO({
        tradingsymbol: optionInstrument.tradingsymbol,
        transaction_type: orderType,
        order_type: "MARKET",
        quantity: optionInstrument.lot_size * lot_size,
        trigger_price: 0,
        price: 0,
        tag: strategyTag
      });
      console.timeEnd('Order' + strategyTag + "_" + tmp_zapi.credentials.user_id);
      console.log(optionInstrument, firstLegOrder);
      console.log({
        user_id: tmp_zapi.credentials.user_id,
        resp: firstLegOrder
      });
      if (firstLegOrder && firstLegOrder.status != 'success') {
        mcb(null, {
          user_id: tmp_zapi.credentials.user_id,
          message: firstLegOrder.message + `\nOrder Invalid Response: ${tmp_zapi.credentials.user_id}, STG: ${strategyTag}\nSymbol: ${optionInstrument.tradingsymbol}, OrderType: ${orderType}`
        });
      } else if (firstLegOrder === false) {
        mcb(null, {
          user_id: tmp_zapi.credentials.user_id,
          message: `Order Invalid Response: ${tmp_zapi.credentials.user_id}, STG: ${strategyTag}\nSymbol: ${optionInstrument.tradingsymbol}, OrderType: ${orderType}`
        });
      }
    } catch (err) {
      // console.log('placeorder', err);
      mcb(null, {
        user_id: tmp_zapi.credentials.user_id,
        message: `Order Invalid Response: ${tmp_zapi.credentials.user_id}, STG: ${strategyTag}\nSymbol: ${optionInstrument.tradingsymbol}, OrderType: ${orderType}`
      })
    }
  }

  placeAllAccount(strategyTag: string, account_quantities: object, running_accounts: any[], optionInstrument: any, orderType: string, multiplier = 1) {
    if (optionInstrument && optionInstrument.tradingsymbol) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return new Promise((resolve, reject) => {

        this.trackOrder(optionInstrument, orderType, strategyTag, multiplier);
        console.log(running_accounts);
        async.map(running_accounts, function (tmp_zapi, cb) {
          if (account_quantities[tmp_zapi.credentials.user_id]) {
            const orderQuantity = account_quantities[tmp_zapi.credentials.user_id] * multiplier;
            let maxQty = 100;
            if (optionInstrument.tradingsymbol.indexOf('BANKNIFTY') == 0) maxQty = 36;
            else if (optionInstrument.tradingsymbol.indexOf('NIFTY') == 0) maxQty = 36;
            if (orderQuantity <= maxQty) {
              this.placeOrder(strategyTag, tmp_zapi, optionInstrument, orderType, orderQuantity, cb);
            } else {
              const orderTranches = tranches(orderQuantity, maxQty);
              async.map(orderTranches, function (orderTranch, cb2) {
                this.placeOrder(strategyTag, tmp_zapi, optionInstrument, orderType, orderTranch, cb2);
              }, cb);
            }
          } else cb();
        }, function (err, resp) {
          resp = resp.filter(c => c);
          if (resp.length > 0) {
            // resp = [].concat.apply([], resp);// made changes here
            resp = [].concat(...resp);
            // notify(JSON.stringify(resp, null, 2));
            resolve(resp);
          } else {
            resolve(true);
          }
        });
      });
    }
  }

  orderFNO(accountId, orderOpt, cb) {
    (async () => {
      console.log(accountId, orderOpt);
      if (accountId && accountId.length == 24) {
        const AccountModel = mongoose.model('account', AccountSchema)
        const account: Account = await AccountModel.findById(accountId);
        if (account) {
          const zapi_n = new Zerodha(account);
          zapi_n.loadConfig(account);
          const session = await zapi_n.checkSession();
          if (!session) await zapi_n.login();
          const resp = await zapi_n.orderFNO(orderOpt);
          cb(null, resp);
        } else cb(null, []);
      } else cb(null, []);
    })();
  };

  private static removeKeys: string[] = ["cancelled_quantity", "disclosed_quantity", "filled_quantity", "guid", "market_protection", "meta", "pending_quantity", "tags", "validity", "variety"];
  private static all_position_cache: any[] = [];
  private static lastRefreshTime: number = 0;

  all_positions(forceRefresh, cb) {
    const reqTime = Number(moment().format('X'));
    // const strategyData = Account.app.models.strategyData;
    if ((reqTime - AccountsService.lastRefreshTime) > 300 || forceRefresh) {
      (async () => {
        // const strategiesPosition = await strategyData.find({});
        // const strategiesOrders = strategiesPosition.reduce((a, s) => {
        //   if (s.positions) {
        //     if (s.positions.BUY && s.positions.BUY.length > 0) a.push(...s.positions.BUY);
        //     if (s.positions.SELL && s.positions.SELL.length > 0) a.push(...s.positions.SELL);
        //   }
        //   return a;
        // }, [])
        const AccountModel = mongoose.model('account', AccountSchema)
        const accounts = await AccountModel.find({});
        async.mapLimit(accounts, 50, function (account: Account, cb2) {
          (async () => {
            try {
              const zapi_n = new Zerodha(account);
              zapi_n.loadConfig(account);
              const session = await zapi_n.login();
              if (session) {
                const positions: any = await zapi_n.positions();
                let orders = await zapi_n.orders();
                orders = orders.filter(order => {
                  return ((order.tag && AccountsService.allStrategies.indexOf(order.tag) != -1))
                });
                orders = orders.map(order => {
                  AccountsService.removeKeys.forEach(k => {
                    delete order[k]
                  });
                  return order;
                });
                // const symbols = Array.from(new Set([...strategiesOrders, ...orders.map(c => c.tradingsymbol)]));
                // if (positions.net) positions.net = positions.net.filter(c => symbols.indexOf(c.tradingsymbol) != -1);
                // console.log(positions.day.length);

                // Object.keys(account.strategy).forEach(k => {
                //   account.strategy[k] = parseInt(account.strategy[k]) * 10;
                // });
                const resp = {
                  accountId: account.id,
                  name: account.name,
                  margin: account.margin,
                  username: account.name,
                  fullname: account.username || account.config.data.user_name,
                  strategy: account.strategy,
                  positions: positions.net,
                  orders: orders,
                  createdAt: moment().startOf('day').toDate(),
                  platform: 'zerodha'
                };
                // console.log('respObject from api ', resp);
                cb2(null, resp);
              } else cb2(null, null);
            } catch (err) {
              console.log(err, "err1");
              cb2(null, null);
            }
          })();
        }, function (err, resp) {
          if (resp) {
            resp = resp.filter(c => c);
            AccountsService.all_position_cache = resp;
            AccountsService.lastRefreshTime = reqTime;
            cb(null, resp);
          } else cb(null, []);
        });
      })();
    } else {
      cb(null, AccountsService.all_position_cache);
    }
  };

  // static squareOff(accountId, options, cb) {
  //   (async () => {
  //     let Log = Account.app.models.log;
  //     if (accountId && accountId.length == 24) {
  //       let zapi_n = new Zerodha();
  //       let account = await Account.findById(accountId);
  //       if (account) {
  //         zapi_n.loadConfig(account);
  //         let session = await zapi_n.checkSession();
  //         if (!session) await zapi_n.login();
  //         closePositions(zapi_n, async function (err, resp) {
  //           try {
  //             if (typeof account.bkp_strategy != 'object') account.bkp_strategy = {};
  //             Object.keys(account.strategy).forEach(s => {
  //               if (parseInt(account.strategy[s]) > 0) {
  //                 account.bkp_strategy[s] = parseInt(account.strategy[s]);
  //                 account.strategy[s] = 0;
  //               }
  //             });
  //           } catch (err) {
  //             console.log(err);
  //           }
  //           await account.save();
  //           try {
  //             let logObj = {
  //               instance: account,
  //               userId: options.accessToken.userId,
  //               ts: new Date(),
  //               updated: "Admin Square off Initiated"
  //             };
  //             Log.create(logObj);
  //           } catch (err) {
  //             console.log(err);
  //           }
  //           cb(null, {
  //             status: true
  //           });
  //         });
  //       } else cb(null, {
  //         status: false
  //       });
  //     } else cb(null, {
  //       status: false
  //     });
  //   })();
  // };
}
