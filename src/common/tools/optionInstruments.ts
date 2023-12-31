// const notify = require("../lib/notify.js");
import * as fs from 'fs';
import axios, { AxiosResponse } from 'axios';
const channelId = 0;
import { NIFTYData } from '@src/common/interface/interface';

async function getInstrumentDetails(underlyings: string = 'NIFTY'): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      url: 'https://api.sensibull.com/v1/instrument_details',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        cookie: 'access_token=free_user;',
      },
      json: true,
      data: {
        underlyings: [underlyings],
      },
    };

    axios(options)
      .then((response: AxiosResponse) => {
        resolve(JSON.parse(response.data[underlyings]));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function getReq(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: url,
      headers: {
        cookie: 'access_token=free_user;',
      },
      json: true,
    };
    axios(options)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

let futureSymbol: string,
  futureToken: number,
  futureLtp: number,
  NIFTY: NIFTYData,
  ivp: number,
  ivTrend: string,
  nearestExpiry: string,
  nextWeekExpiry: any,
  monthlyExpiry: number,
  chain: any,
  futuresInstrument: any[],
  currentExpiryOptions = {};

export async function download(underlying = 'BANKNIFTY') {
  return new Promise(async function (resolve, reject) {
    try {
      NIFTY = await getInstrumentDetails(underlying);
      const expiryDateSorted = Object.values(NIFTY.per_expiry_data).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
      nearestExpiry = expiryDateSorted[0].expiry;
      nextWeekExpiry = expiryDateSorted[1].expiry;
      chain = await getReq('https://api.sensibull.com/v1/instruments/' + underlying);
      ivp = NIFTY.per_expiry_data[nearestExpiry].iv_percentile;
      ivTrend =
        parseFloat(NIFTY.per_expiry_data[nearestExpiry].prev_iv) <
          NIFTY.per_expiry_data[nearestExpiry].impliedVolatility
          ? 'bullish'
          : 'bearish';

      if (typeof chain != 'object' || chain.status != true) console.log('chain data not available.', channelId);
      else {
        futuresInstrument = chain.data.filter((c: { segment: string }) => c.segment == 'NFO-FUT');
        const monthlyIdx = futuresInstrument.findIndex(
          (c: { expiry: string }) => c.expiry.substr(0, 7) === nearestExpiry.substr(0, 7),
        );
        monthlyExpiry = futuresInstrument[monthlyIdx].expiry;
        futureToken = futuresInstrument[monthlyIdx].instrument_token;
        futureSymbol = futuresInstrument[monthlyIdx].tradingsymbol;
        futureLtp = futuresInstrument[monthlyIdx].last_price;
        // max_pain = parseInt(NIFTY.per_expiry_data[monthlyExpiry].max_pain);
        // console.log(chain.data);
        currentExpiryOptions = chain.data
          .filter((c: { expiry: string }) => c.expiry === nearestExpiry)
          .reduce(
            (
              ob: {
                [x: string]: {
                  expiry: string;
                  instrument_token: number;
                  instrument_type: string;
                  last_price: number;
                  lot_size: number;
                  name: string;
                  segment: string;
                  strike: number;
                  tradingsymbol: string;
                };
              },
              elm: {
                strike: number;
                instrument_type: string;
                expiry: string;
                instrument_token: number;
                last_price: number;
                lot_size: number;
                name: string;
                segment: string;
                tradingsymbol: string;
              },
            ) => {
              ob[elm.strike + elm.instrument_type] = {
                expiry: elm.expiry,
                instrument_token: elm.instrument_token,
                instrument_type: elm.instrument_type,
                last_price: elm.last_price,
                lot_size: elm.lot_size,
                name: elm.name,
                segment: elm.segment,
                strike: elm.strike,
                tradingsymbol: elm.tradingsymbol,
              };
              return ob;
            },
            {},
          );

        const nextWeekExpiryOptions = chain.data
          .filter((c: { expiry: string }) => c.expiry === nextWeekExpiry)
          .reduce(
            (
              ob: {
                [x: string]: {
                  expiry: string;
                  instrument_token: number;
                  instrument_type: string;
                  last_price: number;
                  lot_size: number;
                  name: string;
                  segment: string;
                  strike: number;
                  tradingsymbol: string;
                };
              },
              elm: {
                strike: number;
                instrument_type: string;
                expiry: string;
                instrument_token: number;
                last_price: number;
                lot_size: number;
                name: string;
                segment: string;
                tradingsymbol: string;
              },
            ) => {
              ob[elm.strike + elm.instrument_type] = {
                expiry: elm.expiry,
                instrument_token: elm.instrument_token,
                instrument_type: elm.instrument_type,
                last_price: elm.last_price,
                lot_size: elm.lot_size,
                name: elm.name,
                segment: elm.segment,
                strike: elm.strike,
                tradingsymbol: elm.tradingsymbol,
              };
              return ob;
            },
            {},
          );

        const allOptions = chain.data
          .filter((c: { segment: string }) => c.segment == 'NFO-OPT')
          .map(
            (elm: {
              expiry: string;
              instrument_token: number;
              instrument_type: string;
              last_price: number;
              lot_size: number;
              name: string;
              segment: string;
              strike: number;
              tradingsymbol: string;
            }) => ({
              expiry: elm.expiry,
              instrument_token: elm.instrument_token,
              instrument_type: elm.instrument_type,
              last_price: elm.last_price,
              lot_size: elm.lot_size,
              name: elm.name,
              segment: elm.segment,
              strike: elm.strike,
              tradingsymbol: elm.tradingsymbol,
            }),
          );

        const data = {
          symbol: underlying,
          options: allOptions,
          futures: futuresInstrument,
          currentFuture: {
            token: futureToken,
            symbol: futureSymbol,
            ltp: futureLtp,
          },
          monthlyExpiry: monthlyExpiry,
          // max_pain: parseInt(NIFTY.per_expiry_data[monthlyExpiry].max_pain),
          ivp: ivp,
          ivTrend: ivTrend,
          weeklyExpiry: nearestExpiry,
          weeklyInstruments: currentExpiryOptions,
          nextWeekInstruments: nextWeekExpiryOptions,
        };
        resolve(data);
        fs.writeFileSync('optionConfig_' + underlying + '.json', JSON.stringify(data));
      }
    } catch (err) {
      console.log(err);
      reject();
    }
  });
}

export async function config(underlying = 'BANKNIFTY') {
  try {
    // console.log('no download');
    const configFile = import(process.cwd() + '/optionConfig_' + underlying + '.json');
    return configFile;
  } catch (err) {
    console.log('yes download');
    const data = await download(underlying);
    return data;
  }
}

// new CronJob('0 17 9 * * 1-5', download, null, true, 'Asia/Kolkata');
