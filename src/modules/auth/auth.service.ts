import { ConflictException, Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/role.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ConfirmResetPasswordDto } from './dto/confirm-reset-password.dto';

@Injectable()
export class AuthService {
   constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}



  
async validateUser(email: string, password: string): Promise<User> {
  const user = await this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.role', 'role')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.isActive) {
   
    throw new UnauthorizedException('Invalid credentials');
  }

  return user;
}

private async createRefreshToken(
  userId: string,
  payload: any,
): Promise<string> {
  const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
  const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
  if (!secret) {
    // skip creation if no secret, caller should handle absence
    return '';
  }
  const token = this.jwtService.sign(payload, { secret, expiresIn: expiresIn as any });
  const hash = await bcrypt.hash(token, 10);
  await this.userRepository.update(userId, { refreshToken: hash });
  return token;
}

async refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
  const { refreshToken } = dto;
  const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
  if (!secret) {
    throw new InternalServerErrorException('Refresh secret not defined');
  }

  let payload: any;
  try {
    payload = this.jwtService.verify(refreshToken, { secret });
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const user = await this.userRepository.findOne({
    where: { id: payload.sub },
    relations: ['role'],
  });
  if (!user || !user.isActive || !user.refreshToken) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const match = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!match) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const newPayload = { sub: user.id, email: user.email, role: user.role?.name };
  const accessToken = this.jwtService.sign(newPayload);
  const newRefresh = await this.createRefreshToken(user.id, newPayload);

  const { password: _, ...userWithoutPassword } = user;
  return { accessToken, refreshToken: newRefresh, user: userWithoutPassword };
}

async logout(userId: string): Promise<void> {
  // clear stored refresh token
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (user) {
    user.refreshToken = null;
    await this.userRepository.save(user);
  }
}

async login(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken?: string; user: Omit<User, 'password'> }> {
  const user = await this.validateUser(email, password);

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role?.name,
  };

  const accessToken = this.jwtService.sign(payload);

  // only generate refresh token if configuration present
  const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
  let refreshToken: string | undefined;
  if (secret) {
    refreshToken = await this.createRefreshToken(user.id, payload);
  }

  const { password: _, ...userWithoutPassword } = user;
  return refreshToken ? { accessToken, refreshToken, user: userWithoutPassword } : { accessToken, user: userWithoutPassword };
}

async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
  const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
  if (existingEmail) {
    throw new ConflictException('Email already exists');
  }

  if (dto.phone) {
    const existingPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  let role: Role | null = null;

  role = await this.roleRepository.findOne({ where: { name: 'user' } });
  if (!role) {
    role = await this.roleRepository.findOne({ where: {} });
  }
  if (!role) {
    throw new InternalServerErrorException('No role available for user');
  }

  const user = this.userRepository.create({
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: dto.phone,
    password: hashedPassword,
    role,
  });

  let saved: User;
  try {
    saved = await this.userRepository.save(user);
  } catch (error) {
    if (error instanceof QueryFailedError && (error as any).code === '23505') {
      const detail = (error as any).detail || '';
      if (detail.includes('(email)')) {
        throw new ConflictException('Email already exists');
      }
      if (detail.includes('(phone)')) {
        throw new ConflictException('Phone number already exists');
      }
      if (detail.includes('(firstName)')) {
        throw new ConflictException('First name already exists');
      }
      if (detail.includes('(lastName)')) {
        throw new ConflictException('Last name already exists');
      }
      throw new ConflictException('User already exists');
    }
    throw new InternalServerErrorException('Registration failed');
  }

  const { password, ...result } = saved;
  return result;
}

async requestPasswordReset(dto: RequestResetPasswordDto): Promise<{ message: string }> {
  const user = await this.userRepository.findOne({
    where: { email: dto.email },
  });

  if (!user) {
    // Security: Don't reveal if email exists, return generic message
    return { message: 'If an account exists with this email, a password reset link will be sent' };
  }

  if (!user.isActive) {
    return { message: 'If an account exists with this email, a password reset link will be sent' };
  }

  // Generate reset token - using crypto for secure random token
  const resetToken = await this.generateResetToken();
  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  
  // Set token expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    await this.userRepository.update(user.id, {
      resetToken: resetTokenHash,
      resetTokenExpiresAt: expiresAt,
    });
  } catch (error) {
    throw new InternalServerErrorException('Failed to process password reset request');
  }

  // TODO: Send email with reset token to user
  // For now, we're just storing the hashed token
  // In production, you'd send: `http://yourfrontend.com/reset-password?token=${resetToken}`
  
  return { message: 'If an account exists with this email, a password reset link will be sent' };
}

async confirmPasswordReset(dto: ConfirmResetPasswordDto): Promise<{ message: string }> {
  const { token, newPassword } = dto;

  const user = await this.userRepository
    .createQueryBuilder('user')
    .where('user.resetToken IS NOT NULL')
    .addSelect('user.resetToken')
    .getOne();

  if (!user) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  // Verify token hasn't expired
  if (!user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
    // Clear expired token
    await this.userRepository.update(user.id, {
      resetToken: null,
      resetTokenExpiresAt: null,
    });
    throw new BadRequestException('Reset token has expired');
  }

  // Verify token matches
  const isTokenValid = await bcrypt.compare(token, user.resetToken!);
  if (!isTokenValid) {
    throw new BadRequestException('Invalid reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    });
  } catch (error) {
    throw new InternalServerErrorException('Failed to reset password');
  }

  return { message: 'Password has been successfully reset' };
}

private async generateResetToken(): Promise<string> {
  // Generate a cryptographically secure random token
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}
}