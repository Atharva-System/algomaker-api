import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PaperTradeService } from './papertrade.service';
import { PaperTrade } from './papertrade.schema';


@Controller('papertrade')
export class PaperTradeController {
  constructor(private readonly paperTradeService: PaperTradeService) { }
  @Get('/positions/:platform/:accountId/:name/:full_name/:ts')
  
  async findById(
    @Param('platform') platform: string,
    @Param('accountId') accountId: string,
    @Param('name') name: string,
    @Param('full_name') full_name: string,
    @Param('ts') ts: Date,
  ): Promise<PaperTrade> {
    try {
      console.log(platform, accountId, name, full_name, ts)
      const account = await this.paperTradeService.findById('651f992c42db2445de5014ba');
      console.log('route worked', account)
      return account;
    } catch (error) {
      throw new NotFoundException(`Account with ID ${'651f992c42db2445de5014ba'} not found`);
    }
  }
}
