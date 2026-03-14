import { IsString, MinLength } from 'class-validator';

export class CompletePrintDto {
  @IsString()
  @MinLength(10)
  documentId!: string;
}
