// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document ,model } from 'mongoose';
import Zerodha from 'src/lib/Zerodha';

@Schema({ collection: 'account' })
export class Account extends Document {
  @Prop()
  name: string;

  @Prop()
  username: string;

  @Prop({
    type: Object,
  })
  credentials: {
    user_id: string;
    password: string;
    authkey: string;
    answer: string;
  };

  @Prop()
  broker: string;

  @Prop({
    type: Object,
  })
  config: {
    status: string;
    data: {
      user_id: string;
      twofa_type: string;
      user_name: string;
      user_type: string;
      email: string;
      phone: string;
      broker: string;
      bank_accounts: { name: string; branch: string; account: string }[];
      dp_ids: string[];
      products: string[];
      order_types: string[];
      exchanges: string[];
      pan: string;
      user_shortname: string;
      avatar_url: string | null;
      tags: string[];
      password_timestamp: string;
      twofa_timestamp: string;
      meta: {
        cobrands: any[];
        poa: string;
        features: string[];
        silo: string;
        welcome_email_sent: boolean;
      };
    };
  };

  @Prop({
    type: Object,
  })
  margins: {
    equity: {
      enabled: boolean;
      net: number;
      available: {
        adhoc_margin: number;
        cash: number;
        opening_balance: number;
        live_balance: number;
        collateral: number;
        intraday_payin: number;
      };
      utilized: {
        debits: number;
        exposure: number;
        m2m_realised: number;
        m2m_unrealised: number;
        option_premium: number;
        payout: number;
        span: number;
        holding_sales: number;
        turnover: number;
        liquid_collateral: number;
        stock_collateral: number;
        equity: number;
        delivery: number;
      };
    };
    commodity: {
      enabled: boolean;
      net: number;
      available: {
        adhoc_margin: number;
        cash: number;
        opening_balance: number;
        live_balance: number;
        collateral: number;
        intraday_payin: number;
      };
      utilized: {
        debits: number;
        exposure: number;
        m2m_realised: number;
        m2m_unrealised: number;
        option_premium: number;
        payout: number;
        span: number;
        holding_sales: number;
        turnover: number;
        liquid_collateral: number;
        stock_collateral: number;
        equity: number;
        delivery: number;
      };
    };
  };

  @Prop({ type: Object, default: {} })
  strategy: Record<string, number>;

  @Prop({ type: Object, default: {} })
  bkp_strategy: Record<string, number>;

  @Prop()
  margin: number;

  @Prop({
    type: Object,
    default: { $oid: '' },
  })
  clientId: { $oid: string };

  @Prop()
  lastLogin: string;


  static async check(account: any): Promise<any> {
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
  
}

export const AccountSchema = SchemaFactory.createForClass(Account);
export const AccountModel = model<Account>('Account', AccountSchema);

