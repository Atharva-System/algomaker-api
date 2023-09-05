/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Zerodha from './lib/Zerodha';
import kiteTicker from './lib/KiteTicker';

let base_account: any;

// let liveFeed: any, public_token: any;
// async function ticker(subs) {
//   // console.log(public_token, '+++++++++++++')
//   liveFeed = new kiteTicker({
//     api_key: 'kitefront',
//     access_token: public_token
//   });
//   liveFeed.connect();
//   // liveFeed.on("ticks", storeTicks);
//   liveFeed.on("connect", function () {
//     console.log('PT: Banknifty Live Feed Connected');
//     liveFeed.subscribe(subs);
//     liveFeed.setMode(liveFeed.modeFull, subs);
//   });
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(9000);
  base_account = {
    "_id": {
      "$oid": "648213302b148831b4d60cbf"
    },
    "name": "JAH883",
    "username": "Zerodha",
    "credentials": {
      "user_id": "JAH883",
      "password": "Shri@123",
      "authkey": "ZHUVMACX6UQKRXRYCYVQ3YNE4AMTNGR5",
      "answer": "328411"
    },
    "broker": "zerodha",
    "config": {
      "status": "success",
      "data": {
        "user_id": "JAH883",
        "twofa_type": "totp",
        "user_name": "Sahebrao Pandurang Pawar",
        "user_type": "individual",
        "email": "sppawar.trading@gmail.com",
        "phone": "*8514",
        "broker": "ZERODHA",
        "bank_accounts": [
          {
            "name": "STATE BANK OF INDIA",
            "branch": "",
            "account": "*3312"
          }
        ],
        "dp_ids": [
          "1208160124844383"
        ],
        "products": [
          "CNC",
          "NRML",
          "MIS",
          "BO",
          "CO"
        ],
        "order_types": [
          "MARKET",
          "LIMIT",
          "SL",
          "SL-M"
        ],
        "exchanges": [
          "CDS",
          "BFO",
          "BCD",
          "BSE",
          "NFO",
          "MF",
          "NSE"
        ],
        "pan": "*887N",
        "user_shortname": "Sahebrao",
        "avatar_url": null,
        "tags": [
          "select",
          "res_no_nn"
        ],
        "password_timestamp": "2023-06-01 21:06:23",
        "twofa_timestamp": "2023-06-08 23:08:53",
        "meta": {
          "cobrands": [],
          "poa": "consent",
          "features": [
            "20depth"
          ],
          "silo": "a",
          "welcome_email_sent": true
        }
      }
    },
    "margins": {
      "equity": {
        "enabled": true,
        "net": 769730.875,
        "available": {
          "adhoc_margin": 0,
          "cash": 4767346.8,
          "opening_balance": 4767346.8,
          "live_balance": 769730.875,
          "collateral": 0,
          "intraday_payin": 0
        },
        "utilised": {
          "debits": 3997615.925,
          "exposure": 1099453.675,
          "m2m_realised": 0,
          "m2m_unrealised": 0,
          "option_premium": -242183.75,
          "payout": 0,
          "span": 3140346,
          "holding_sales": 0,
          "turnover": 0,
          "liquid_collateral": 0,
          "stock_collateral": 0,
          "equity": 0,
          "delivery": 0
        }
      },
      "commodity": {
        "enabled": false,
        "net": 0,
        "available": {
          "adhoc_margin": 0,
          "cash": 0,
          "opening_balance": 0,
          "live_balance": 0,
          "collateral": 0,
          "intraday_payin": 0
        },
        "utilised": {
          "debits": 0,
          "exposure": 0,
          "m2m_realised": 0,
          "m2m_unrealised": 0,
          "option_premium": 0,
          "payout": 0,
          "span": 0,
          "holding_sales": 0,
          "turnover": 0,
          "liquid_collateral": 0,
          "stock_collateral": 0,
          "equity": 0,
          "delivery": 0
        }
      }
    },
    "strategy": {
      "STG5": 24,
      "AudiB1": 0,
      "AudiB2": 0,
      "AudiTT": 0,
      "AudiTT2": 0,
      "STG16": 0,
      "STG17": 0,
      "B4": 0,
      "T3": 0,
      "Super20": 0,
      "MB-2k": 0,
      "Hedge": 0,
      "Strangle2k": 0,
      "alto": 0,
      "mini": 0,
      "STG1": 0,
      "STG2": 0,
      "STG3": 0,
      "STG4": 0,
      "v2": 0,
      "BBT5": 0,
      "mStrangle": 0,
      "BBTn5": 0,
      "nStrangle": 0,
      "Strangle": 0
    },
    "margin": 769730,
    "bkp_strategy": false,
    "clientId": {
      "$oid": "64915c558d529a064861214a"
    },
    "lastLogin": 1687486652941
  };
  console.log('bootstrap initiated')
  let zapi_base = new Zerodha(base_account)
  await zapi_base.login();
  // public_token = zapi_base.getAuthorization();
  // setToken(public_token);
}
bootstrap();
