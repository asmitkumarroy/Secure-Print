import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateDocumentUploadDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pages!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  copies!: number;

  @IsIn(['bw', 'color'])
  colorMode!: 'bw' | 'color';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  expiryMinutes?: number;
}
