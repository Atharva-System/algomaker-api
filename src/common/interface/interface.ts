import mongoose from "mongoose";

export interface OptionData {
  currentFuture?: {
    token: string;
  };
  weeklyInstruments?: Record<string, any>;
  nextWeekInstruments?: Record<string, any>;
}
export interface Credential {
  user_id: string,
  password: string,
  authkey: string,
  answer: string,
}
export interface Config {
  data: {
    user_name: string;
  }
}

export interface BaseAccount {
  id?: mongoose.Types.ObjectId;
  name?: string;
  username?: string;
  margin: object;
  credentials: Credential;
  config: Config;
  lastLogin: string;
  strategy: object;
}

export interface Headers {
  [key: string]: string;
}

export interface RequestOptions {
  method: string;
  url: string;
  headers: Headers;
  body?: any;
  data?: any;
  form?: any;
  json?: boolean;
  gzip?: boolean;
  jar?: any;
}

export interface Tick {
  instrument_token: number;
  last_price: number;
}

export interface PerExpiryData {
  prev_iv: string;
  impliedVolatility: number;
  max_pain: number | undefined;
  expiry: string;
  daysToExpiry: number;
  iv_percentile: any;
}

export interface NIFTYData {
  per_expiry_data: Record<string, PerExpiryData>;
}

export interface AccountPositions {
  orders: any[];
  accountId: any;
  createdAt: Date;
}

// interface OptionData {
//   currentFuture?: {
//     token: string;
//   };
//   weeklyInstruments?: Record<string, any>;
//   nextWeekInstruments?: Record<string, any>;
// }

// interface AccountConfig {
//   status: string;
//   data: {
//       user_id: string;
//       twofa_type: string;
//       user_name: string;
//       user_type: string;
//       email: string;
//       phone: string;
//       broker: string;
//       bank_accounts: {
//           name: string;
//           branch: string;
//           account: string;
//       }[];
//       // ... 10 more properties ...
//       meta: {
//           // ... properties inside meta ...
//       };
//   };
// }
