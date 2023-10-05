import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StrategyPNL, StrategyPNLSchema } from './strategyPNL.schema';
import { StrategyPNLService } from './strategyPNL.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: StrategyPNL.name, schema: StrategyPNLSchema }])],
  controllers: [],
  providers: [StrategyPNLService],
})
export class StrategyPNLModule { }
