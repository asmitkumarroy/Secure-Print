import { IsOptional, IsString, MinLength } from 'class-validator';

export class CompletePrintDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  documentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  token?: string;
}
