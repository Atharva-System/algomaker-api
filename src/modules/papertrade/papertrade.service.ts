import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment'
import { PaperTrade, PaperTradeDocument } from '../papertrade/papertrade.schema';

@Injectable()
export class PaperTradeService {
  constructor(@InjectModel(PaperTrade.name) private readonly paperTradeModel: Model<PaperTradeDocument>) { }

  async positions(cb, ts?) {
    (async () => {
      if (typeof ts == 'function') {
        cb = ts;
        ts = false;
      }
      let today = moment().startOf('day').toDate();
      let todayEnd = moment().endOf('day').toDate();
      if (ts) {
        today = moment(ts, 'X').startOf('day').toDate();
        todayEnd = moment(ts, 'X').endOf('day').toDate();
      }
      const data = await this.paperTradeModel.find({
        order_timestamp: {
          $gte: today,
          $lte: todayEnd, 
        }
      })
      console.log(today, todayEnd)
      console.log(data, 'from model data')
      let strategies = [];
      const strategy_paper = {};
      data.forEach((order) => {
        if (!strategy_paper[order.tag]) strategy_paper[order.tag] = [];
        strategy_paper[order.tag].push(order);
      });
      strategies = Object.keys(strategy_paper);
      const strategy_positions = {};
      strategies.forEach((strategy) => {
        if (strategy_paper[strategy] && strategy_paper[strategy].length > 0) {
          strategy_positions[strategy] = {};
          strategy_paper[strategy].forEach((order) => {
            if (order.status == 'COMPLETE') {
              if (!strategy_positions[strategy][order.tradingsymbol]) {
                strategy_positions[strategy][order.tradingsymbol] = {
                  "tradingsymbol": order.tradingsymbol,
                  "instrument_token": order.instrument_token,
                  "quantity": order.transaction_type == 'SELL' ? -1 * order.quantity : order.quantity,
                  "average_price": order.average_price,
                  "last_price": order.average_price,
                  "m2m": 0,
                  "sell_quantity": 0,
                  "sell_price": 0,
                  "sell_value": 0,
                  "buy_quantity": 0,
                  "buy_price": 0,
                  "buy_value": 0,
                };

                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_quantity"] = order.quantity;
                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_price"] = order.average_price;
                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_value"] = order.average_price * order.quantity;
              } else {
                if (order.transaction_type == 'SELL') {
                  strategy_positions[strategy][order.tradingsymbol].quantity += -1 * order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].sell_quantity += order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].sell_value += Math.round(order.quantity * order.average_price);
                  strategy_positions[strategy][order.tradingsymbol].sell_price = Math.round(strategy_positions[strategy][order.tradingsymbol].sell_value / strategy_positions[strategy][order.tradingsymbol].sell_quantity * 100) / 100;
                } else {
                  strategy_positions[strategy][order.tradingsymbol].quantity += order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].buy_quantity += order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].buy_value += Math.round(order.quantity * order.average_price);
                  strategy_positions[strategy][order.tradingsymbol].buy_price = Math.round(strategy_positions[strategy][order.tradingsymbol].buy_value / strategy_positions[strategy][order.tradingsymbol].buy_quantity * 100) / 100;
                }
              }

              if (strategy_positions[strategy][order.tradingsymbol].quantity == 0) {
                strategy_positions[strategy][order.tradingsymbol].m2m = strategy_positions[strategy][order.tradingsymbol].sell_value - strategy_positions[strategy][order.tradingsymbol].buy_value;
              }
            }
          });
        }
      });

      cb(null, {
        accounts: Object.keys(strategy_positions).map(strategy => ({
          accountId: strategy,
          name: "Demo",
          username: strategy,
          fullname: strategy,
          strategy: strategy,
          positions: Object.values(strategy_positions[strategy]),
          orders: strategy_paper[strategy],
          platform: 'paper'
        })),
        orders: strategy_paper,
        ts: today,
        positions: strategy_positions
      });
    })();
  };
}
