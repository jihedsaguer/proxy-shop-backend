import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ConfirmResetPasswordDto } from './dto/confirm-reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshDto) {
        return this.authService.refresh(dto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@User() user: any) {
        await this.authService.logout(user.id);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@User() user: any) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(@Body() dto: RequestResetPasswordDto) {
        return this.authService.requestPasswordReset(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async confirmPasswordReset(@Body() dto: ConfirmResetPasswordDto) {
        return this.authService.confirmPasswordReset(dto);
    }
}

