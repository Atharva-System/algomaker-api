import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaperTrade, PaperTradeSchema } from './papertrade.schema';
import { PaperTradeService } from './papertrade.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaperTrade.name, schema: PaperTradeSchema }])],
  controllers: [],
  providers: [PaperTradeService],
})
export class PaperTradeModule {}
