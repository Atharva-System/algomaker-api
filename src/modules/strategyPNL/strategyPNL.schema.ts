import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface Open {
  CE: number;
  PE: number;
}

@Schema({ collection: 'strategyPNL' })
export class StrategyPNL extends Document {

  @Prop({ type: Date })
  ts: Date;

  @Prop({ type: String })
  strategy: string;

  @Prop({ type: Number })
  m2m: number;

  @Prop({ type: Object })
  open: Open;
}

export const StrategyPNLSchema = SchemaFactory.createForClass(StrategyPNL);
export type StrategyPNLDocument = StrategyPNL & Document;


