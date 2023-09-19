import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from './accounts.schema';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Account> {
    try {
      const account = await this.accountsService.findById(id);
      return account;
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }
}
