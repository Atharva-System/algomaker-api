import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaperTrade, PaperTradeSchema } from './papertrade.schema';
import { PaperTradeService } from './papertrade.service';
import { PaperTradeController } from './papertrade.controller';
import { StrategyPNL, StrategyPNLSchema } from '../strategyPNL/strategyPNL.schema';
import { StrategyPNLService } from '../strategyPNL/strategyPNL.service';


@Module({
  imports: [MongooseModule.forFeature([{ name: PaperTrade.name, schema: PaperTradeSchema }]),
  MongooseModule.forFeature([{ name: StrategyPNL.name, schema: StrategyPNLSchema }])],
  controllers: [PaperTradeController],
  providers: [PaperTradeService],
  exports: [PaperTradeService, StrategyPNLService],
})
export class PaperTradeModule { }
