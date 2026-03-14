import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly users: Array<{ id: string; email: string; name?: string }> = [];

  createUser(dto: CreateUserDto) {
    const created = { id: randomUUID(), email: dto.email, name: dto.name };
    this.users.push(created);
    return created;
  }

  listUsers() {
    return this.users;
  }
}
