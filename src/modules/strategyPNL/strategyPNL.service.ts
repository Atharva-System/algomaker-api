import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StrategyPNL, StrategyPNLDocument } from './strategyPNL.schema';

@Injectable()
export class StrategyPNLService {
  constructor(@InjectModel(StrategyPNL.name) private readonly strategyPNLModel: Model<StrategyPNLDocument>) { }

  async create(data) {
    this.strategyPNLModel.create(data);
  }
}
