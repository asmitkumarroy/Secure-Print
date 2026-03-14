import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateShopDto } from './dto/create-shop.dto';

@Injectable()
export class ShopsService {
  private readonly shops: Array<{
    id: string;
    name: string;
    location: string;
    ownerEmail: string;
  }> = [];

  create(dto: CreateShopDto) {
    const shop = {
      id: randomUUID(),
      name: dto.name,
      location: dto.location,
      ownerEmail: dto.ownerEmail,
    };
    this.shops.push(shop);
    return shop;
  }

  list() {
    return this.shops;
  }
}
