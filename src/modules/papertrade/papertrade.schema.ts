import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseAccount } from 'src/interface/interface';
// import Zerodha from 'src/lib/Zerodha';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';

enum OrderStatus {
  COMPLETE = 'COMPLETE',
}

@Schema({ collection: 'paper-trade' })
export class PaperTrade extends Document {

  @Prop({ type: Date, required: true })
  @IsDate()
  order_timestamp: Date;

  @Prop({ type: String, enum: OrderStatus, required: true })
  @IsEnum(OrderStatus)
  status: string;

  @Prop({ type: String, required: true })
  @IsString()
  exchange: string;

  @Prop({ type: String, required: true })
  @IsString()
  tradingsymbol: string;

  @Prop({ type: Number, required: true })
  @IsNumber()
  instrument_token: number;

  @Prop({ type: String, required: true })
  @IsString()
  order_type: string;

  @Prop({ type: String, required: true })
  @IsString()
  transaction_type: string;

  @Prop({ type: Number, required: true })
  @IsNumber()
  quantity: number;

  @Prop({ type: Number, required: true })
  @IsNumber()
  filled_quantity: number;

  @Prop({ type: String, required: true })
  @IsString()
  tag: string;

  @Prop({ type: Number })
  @IsNumber()
  average_price: number;
}

export const PaperTradeSchema = SchemaFactory.createForClass(PaperTrade);
// export const PaperTradeModel = model<PaperTrade>('Account', PaperTradeSchema);

