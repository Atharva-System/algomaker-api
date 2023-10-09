import { Controller, Get, Param } from '@nestjs/common';
import { PaperTradeService } from './papertrade.service';
import { PaperTrade } from './papertrade.schema';


@Controller('papertrade')
export class PaperTradeController {
  constructor(private readonly paperTradeService: PaperTradeService) { }
  @Get('/positions/:platform/:accountId/:name/:full_name/:ts')

  async getPositions(
    @Param('platform') platform: string,
    @Param('accountId') accountId: string,
    @Param('name') name: string,
    @Param('full_name') full_name: string,
    @Param('ts') ts: Date,
  ): Promise<PaperTrade | boolean> {
    try {
      const getPositions = await this.paperTradeService.getPositions(platform, accountId, name, full_name, ts)
      console.log(getPositions);
      return true;
    } catch (error) {
      console.log(error)
    }
  }
}
