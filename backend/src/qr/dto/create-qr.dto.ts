import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQrDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  token!: string;
}
