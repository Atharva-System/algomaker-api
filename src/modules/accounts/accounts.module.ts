import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account, AccountSchema } from './accounts.schema';
import { OrderbookService } from '../orderbook/ordebook.service';
import { OrderbookSchema } from '../orderbook/orderbook.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  MongooseModule.forFeature([{ name: 'Orderbook', schema: OrderbookSchema }]),],
  controllers: [AccountsController],
  providers: [AccountsService,OrderbookService],
})
export class AccountsModule {}
