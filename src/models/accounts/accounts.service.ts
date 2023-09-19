import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from './accounts.schema';

@Injectable()
export class AccountsService {
  constructor(@InjectModel(Account.name) private accountModel: Model<Account>) {}

  async findById(id: string): Promise<Account | null> {
    try {
      const account = await this.accountModel.findById(id).exec();
      if (!account) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }
      return account;
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }
}
