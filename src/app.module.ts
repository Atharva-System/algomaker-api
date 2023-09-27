import 'dotenv/config';
import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './modules/accounts/accounts.module';
import * as mongoose from 'mongoose';

@Module({
  imports: [MongooseModule.forRoot(process.env.db_url), AccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await this.connectToDatabase();
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
