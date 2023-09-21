/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import KiteTicker from '../lib/KiteTicker';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../app.module';
import Zerodha from '../lib/Zerodha';
import * as optionsConfig from '../tools/optionInstruments';
import { Account, AccountSchema,AccountModel } from '../models/accounts/accounts.schema';
import * as mongoose from 'mongoose';
import { Tick } from 'src/interface/interface';

// const channelId = 0;
// const strategyTag = 'STG5';

let zapi: boolean | Zerodha;
let public_token: any, liveFeed: any;
const masterId = process.env.masterId;
const ticksCache = {};
// const slippage = 0;
// const ticksCacheFrontend = {};
// const positionInstruments = {};

async function zerodha_init(account: mongoose.Document<unknown, object, Account> & Account & { _id: mongoose.Types.ObjectId; }) {
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

async function ticker(subs: number[]) {
  liveFeed = new KiteTicker({
    access_token: public_token,
  });
  liveFeed.connect();
  liveFeed.on('ticks', function (ticks: Tick[]) {
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

async function checkTicks(ticks: any[]) {
  ticks = ticks.reduce(function (ob: { [x: string]: any; }, el: { instrument_token: string | number; }) {
    ob[el.instrument_token] = el;
    return ob;
  }, {});

  Object.assign(ticksCache, ticks);
}

let futureToken: string | number, currentExpiryOptions = {};
async function runStrategy() {
  try {
    const optionData = await optionsConfig.config();
    // console.log(optionData, 'OPtion data');
    futureToken = 260105;
    currentExpiryOptions = optionData.weeklyInstruments;

    const optionTokens = (Object.values(currentExpiryOptions) as Array<{ instrument_token: number }>).map(c => c.instrument_token);
    // await getAccounts();
    console.log(masterId);
    await mongoose.connect(process.env.db_url)
    const base_acc = await AccountModel.findById(masterId);
    zapi = await zerodha_init(base_acc);
    ticker([futureToken, ...optionTokens]);

    // new CronJob('30 * * * * 1-5', getAccounts, null, true, 'Asia/Kolkata');
    // new CronJob('0 */3 * * * 1-5', check, null, true, 'Asia/Kolkata');
  } catch (err) {
    console.log(err);
  }
}

runStrategy();
// new CronJob('30 16 9 * * 1-5', runStrategy, null, true, 'Asia/Kolkata');
// new CronJob('0 28 15 * * 1-5', async function () {
//   strategy_running = false;
// }, null, true, 'Asia/Kolkata');
// new CronJob('30 30 15 * * 1-5', function () {
//   process.exit();
// }, null, true, 'Asia/Kolkata');