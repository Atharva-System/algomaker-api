import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

enum OrderStatus {
  COMPLETE = 'COMPLETE',
}

@Schema({ collection: 'paper-trade' })
export class PaperTrade extends Document {

  @Prop({ type: Date })
  order_timestamp: Date;

  @Prop({ type: String, enum: OrderStatus })
  status: string;

  @Prop({ type: String })
  exchange: string;

  @Prop({ type: String })
  tradingsymbol: string;

  @Prop({ type: Number })
  instrument_token: number;

  @Prop({ type: String })
  order_type: string;

  @Prop({ type: String })
  transaction_type: string;

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: Number })
  filled_quantity: number;

  @Prop({ type: String })
  tag: string;

  @Prop({ type: Number })
  average_price: number;
}

export const PaperTradeSchema = SchemaFactory.createForClass(PaperTrade);
export type PaperTradeDocument = PaperTrade & Document;


