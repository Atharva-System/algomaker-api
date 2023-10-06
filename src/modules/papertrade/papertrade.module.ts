import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaperTrade, PaperTradeSchema } from './papertrade.schema';
import { PaperTradeService } from './papertrade.service';
import { PaperTradeController } from './papertrade.controller';


@Module({
  imports: [MongooseModule.forFeature([{ name: PaperTrade.name, schema: PaperTradeSchema }])],
  controllers: [PaperTradeController],
  providers: [PaperTradeService],
  exports: [PaperTradeService],
})
export class PaperTradeModule { }
