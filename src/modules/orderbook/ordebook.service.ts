import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Orderbook, OrderbookDocument } from './orderbook.schema';

@Injectable()
export class OrderbookService {
  constructor(@InjectModel(Orderbook.name) private readonly orderbookModel: Model<OrderbookDocument>) {  }

  async findById(id: string): Promise<Orderbook | null> {
    try {
      const orderbook = await this.orderbookModel.findById(id).exec();
      if (!orderbook) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }
      return orderbook;
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  async upsertAccountPosition(accountPositionData, accountPosition: Partial<Orderbook>): Promise<Orderbook> {
    const filter = {
      createdAt: accountPositionData.createdAt,
      accountId: accountPositionData.accountId,
    };
    return this.orderbookModel.findOneAndUpdate(filter, accountPosition, {
      upsert: true,
      new: true, // Return the updated document
      setDefaultsOnInsert: true, // Set default values on insert
    }).exec();
  }
}
