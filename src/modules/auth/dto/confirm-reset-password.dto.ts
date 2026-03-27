import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
