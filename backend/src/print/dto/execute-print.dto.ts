import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ExecutePrintDto {
  @IsString()
  token!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  pages?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  copies?: number;

  @IsOptional()
  @IsIn(['bw', 'color'])
  colorMode?: 'bw' | 'color';

  @IsOptional()
  @IsBoolean()
  testSaveAsPdf?: boolean;
}
