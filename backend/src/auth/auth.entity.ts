export class AuthSessionEntity {
  sessionId!: string;
  email!: string | null;
  mode!: 'anonymous' | 'identified';
}
