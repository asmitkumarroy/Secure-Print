import { IsEmail, IsOptional } from 'class-validator';

export class CreateAuthSessionDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
