import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthSessionDto } from './dto/create-auth-session.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { status: 'ok', module: 'auth' };
  }

  @Post('session')
  createSession(@Body() dto: CreateAuthSessionDto) {
    return this.authService.createSession(dto.email);
  }
}
