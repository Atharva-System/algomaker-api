import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Zerodha from './lib/Zerodha';
import * as optionsConfig from './tools/optionInstruments';
import { AccountModel } from './models/accounts/accounts.schema';
import KiteTicker from './lib/KiteTicker';

interface OptionData {
  currentFuture?: {
    token: string;
  };
  weeklyInstruments?: Record<string, any>;
  nextWeekInstruments?: Record<string, any>;
}

let public_token: any, liveFeed: any, base_account: any;
const masterId = process.env.masterId;
const ticksCache = {};
// const slippage = 0;
const ticksCacheFrontend = {};
const positionInstruments = {};

async function ticker(underlying: string, subs: any[]) {
  liveFeed = new KiteTicker({
    access_token: public_token,
  });
  liveFeed.connect();
  liveFeed.on('ticks', function (ticks: any) {
    //here we will get live ticks and it might be stop around 7:00 pm
    storeTicks(ticks);
    // console.log('ticks', ticks);
    // console.log('ticks', underlying);
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

function storeTicks(ticks) {
  const ticks2 = ticks.reduce(function (ob, el) {
    ob[el.instrument_token] = el;
    return ob;
  }, {});
  Object.assign(ticksCache, ticks2);
  const ticks3 = ticks.reduce(function (ob, el) {
    ob[el.instrument_token] = el.last_price;
    return ob;
  }, {});
  Object.assign(ticksCacheFrontend, ticks3);
  // console.log(ticks3);
  //send all ticks3 to frontend , this is for nifty and banknifty ,this logic can be handle on frontend(temporary)
  Object.assign(positionInstruments, ticks3);
  const niftyTicker = positionInstruments['256265'];
  const bankniftyTicker = positionInstruments['260105'];
  console.log(`Nifty : ${niftyTicker} BankNifty : ${bankniftyTicker}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.port);

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

  ticker('BANKNIFTY', [256265, 260105, futureToken, ...optionTokens, ...b_optionTokens]);

  const n_optionData: OptionData = await optionsConfig.download('NIFTY');
  const n_futureToken = n_optionData.currentFuture.token;
  const n_currentExpiryOptions = n_optionData.weeklyInstruments;
  const n_nextWeekExpiryOptions = n_optionData.nextWeekInstruments;
  const n_optionTokens = Object.values(n_currentExpiryOptions).map((c) => c.instrument_token);
  const n_nextWeekOptionTokens = Object.values(n_nextWeekExpiryOptions).map((c) => c.instrument_token);

  ticker('NIFTY', [n_futureToken, ...n_optionTokens, ...n_nextWeekOptionTokens]);

}
bootstrap();
