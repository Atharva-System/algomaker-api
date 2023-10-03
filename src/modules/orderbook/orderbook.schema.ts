import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'orderbook' })
export class Orderbook extends Document {
  @Prop({ type: String })
  _id: string;

  @Prop({ type: String })
  accountId: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: String })
  fullname: string;

  @Prop({ type: String })
  name: string;

  @Prop()
  orders: any[];

  @Prop({ type: String })
  platform: string;

  @Prop([String])
  positions: string[];

  @Prop({ type: Object })
  strategy: Record<string, number>;

  @Prop()
  username: string;
}

export const OrderbookSchema = SchemaFactory.createForClass(Orderbook);

export type OrderbookDocument = Orderbook & Document;

