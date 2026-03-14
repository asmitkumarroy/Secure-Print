import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  createSession(email?: string) {
    return {
      sessionId: randomUUID(),
      email: email ?? null,
      mode: email ? 'identified' : 'anonymous',
    };
  }
}
