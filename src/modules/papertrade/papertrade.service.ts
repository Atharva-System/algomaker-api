import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment'
import { PaperTrade, PaperTradeDocument } from '../papertrade/papertrade.schema';
import { StrategyPNLService } from '../strategyPNL/strategyPNL.service';

@Injectable()
export class PaperTradeService {
  constructor(@InjectModel(PaperTrade.name)
  private readonly paperTradeModel: Model<PaperTradeDocument>,
    private readonly strategyPNLService: StrategyPNLService,) { }

  private tradePositions = [];
  private totalM2M = 0;
  private showDummyRowsCount = 3;
  private account_name: string;
  private full_name: string;
  private platform: string;
  private timestamp: Date | any;
  private positionInstruments = {};
  private orders = [];
  private showManageOrder = false;
  private loadingPositions = false;
  private loadingOrders = false;
  private strategyPosition = {};
  private totalPremium = {};
  private tradeableSymbols = [];
  private searchedSymbols = [];
  private orderList = [];
  private newOrderFrm = {};
  private instrumentsLoaded = false;
  private maxTodayPNL: number;
  private minTodayPNL: number;

  async fillPositions(resp) {
    this.tradePositions = resp;
    this.allPositions = resp;
    this.loadingPositions = false;
    // socket = ticker.fn();
    // connectSocket();
    updatePositionsPNL(positionInstruments);
    getDayPNL();
    calculatePremium(resp);
  }

  async getPositions(platform, accountId, name, full_name, ts) {
    let loadingPositions = true;
    let show_LTP = true;
    const timestamp = ts
    const filter = { ts: 0 };
    if (timestamp && timestamp != 0) {
      filter.ts = parseInt(timestamp);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      show_LTP = false;
    }
    try {
      this.positions(filter).then((resp: any) => {
        fillPositions(Object.values(resp.positions[accountId]));
        resp.orders[accountId] = resp.orders[accountId].map((order) => {
          order.order_timestamp = moment(order.order_timestamp).format();
          return order;
        });
        // fillOrders(resp.orders[accountId]);
        // strategyData = resp.orders[accountId];// i think its redundant but still check it again
        // checkPaperUpdates();
        console.log(resp.ts);
        const todayStart = moment(resp.ts).startOf('day').toDate();
        const todayEnd = moment(resp.ts).endOf('day').toDate();
        // if ($rootScope.superadmin) {
        //   getOHLCGraph();
        // } else {
        const params = {
          accountId: accountId,
          todayStart: todayStart.toISOString(),
          todayEnd: todayEnd.toISOString()
        }
        this.strategyPNLService.findStrategyPositions(params).then((resp: any) => {
          console.log(resp, 'startegypnl');
          // drawChart(resp);
          const sortedPNL = resp.sort((a, b) => (b.m2m - a.m2m));
          this.maxTodayPNL = sortedPNL[0].m2m;
          this.minTodayPNL = sortedPNL[sortedPNL.length - 1].m2m;
        });
      });
    } catch (error) {
      throw new NotFoundException(`Account with ID not found`);

    }
  }

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
      // console.log(data, 'from model data')
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

                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_quantity"] = order.quantity || null;
                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_price"] = order.average_price || null;
                strategy_positions[strategy][order.tradingsymbol][(order.transaction_type).toLowerCase() + "_value"] = order.average_price * order.quantity || null;
              } else {
                if (order.transaction_type == 'SELL') {
                  strategy_positions[strategy][order.tradingsymbol].quantity += -1 * order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].sell_quantity += order.quantity;
                  const sellValue = Math.round(order.quantity * order.average_price) || null
                  strategy_positions[strategy][order.tradingsymbol].sell_value += sellValue;
                  strategy_positions[strategy][order.tradingsymbol].sell_price = Math.round(strategy_positions[strategy][order.tradingsymbol].sell_value / strategy_positions[strategy][order.tradingsymbol].sell_quantity * 100) / 100 || null;
                  console.log(strategy_positions)
                } else {
                  strategy_positions[strategy][order.tradingsymbol].quantity += order.quantity;
                  strategy_positions[strategy][order.tradingsymbol].buy_quantity += order.quantity;
                  const buyValue = Math.round(order.quantity * order.average_price) || null
                  strategy_positions[strategy][order.tradingsymbol].buy_value += buyValue;
                  strategy_positions[strategy][order.tradingsymbol].buy_price = Math.round(strategy_positions[strategy][order.tradingsymbol].buy_value / strategy_positions[strategy][order.tradingsymbol].buy_quantity * 100) / 100 || null;
                }
              }

              if (strategy_positions[strategy][order.tradingsymbol].quantity == 0) {
                strategy_positions[strategy][order.tradingsymbol].m2m = strategy_positions[strategy][order.tradingsymbol].sell_value - strategy_positions[strategy][order.tradingsymbol].buy_value || null;
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
