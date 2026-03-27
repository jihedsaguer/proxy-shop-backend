import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RefreshDto {
  @Transform(({ value, obj }) => value ?? obj.refresh_token)
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
