import 'dotenv/config';
import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './modules/accounts/accounts.module';
import * as mongoose from 'mongoose';
import { PaperTradeModule } from './modules/papertrade/papertrade.module';
import { SocketGateway } from './common/gateways/socket/socket.gateway';
import { EventEmitter } from 'events'
import { StrategyPNLModule } from './modules/strategyPNL/strategyPNL.module';
export const customEvent = new EventEmitter();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.db_url),
    AccountsModule,
    PaperTradeModule,
    StrategyPNLModule
  ],
  controllers: [AppController],
  providers: [AppService, SocketGateway],
})
export class AppModule implements OnModuleInit {

    onModuleInit() {
      this.connectToDatabase();
    }

  private async connectToDatabase() {
    try {
      await mongoose.connect(process.env.db_url);
      if (mongoose.connection.readyState === 1) {
        console.log('Connected to MongoDB');
      } else {
        console.log('Not connected to MongoDB');
      }
    } catch (error) {
      console.error('Error while connecting to MongoDB:', error);
    }
  }
}

