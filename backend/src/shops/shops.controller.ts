import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  listShops() {
    return this.shopsService.list();
  }

  @Post()
  createShop(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }
}
