import { IsString, IsOptional, IsUrl } from "class-validator";

export class CreateProductRequestDto {
  @IsUrl()
  url: string;

  @IsString()
  size: string;

  @IsOptional()
  @IsString()
  color?: string;
}