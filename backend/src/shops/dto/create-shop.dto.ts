import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(200)
  location!: string;

  @IsEmail()
  ownerEmail!: string;
}
