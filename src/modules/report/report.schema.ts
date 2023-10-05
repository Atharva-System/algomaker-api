import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'report' })
export class Report extends Document {

  @Prop({ type: Date })
  ts: Date;

  @Prop({ type: String })
  clientCode: string;

  @Prop({ type: String })
  platform: string;

  @Prop({ type: String })
  strategy: string;

  @Prop({ type: Number })
  pnl: number;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
export type ReportDocument = Report & Document;


