import { IsEmail, IsNotEmpty , IsOptional ,IsString } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email: string;
    
    @IsOptional()
    @IsString()
    phone?: string;


    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsString() 
    password: string;

    @IsOptional()
    @IsString()
    roleId?: string;

}
