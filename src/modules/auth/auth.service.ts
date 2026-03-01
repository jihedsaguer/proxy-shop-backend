import { ConflictException, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';

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

async refresh(dto: RefreshDto): Promise<{ access_token: string; refresh_token: string }> {
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
  const access_token = this.jwtService.sign(newPayload);
  const newRefresh = await this.createRefreshToken(user.id, newPayload);
  return { access_token, refresh_token: newRefresh };
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
): Promise<{ access_token: string; refresh_token?: string }> {
  const user = await this.validateUser(email, password);

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role?.name,
  };

  const access_token = this.jwtService.sign(payload);

  // only generate refresh token if configuration present
  const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
  let refreshToken: string | undefined;
  if (secret) {
    refreshToken = await this.createRefreshToken(user.id, payload);
  }

  return refreshToken ? { access_token, refresh_token: refreshToken } : { access_token };
}

async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
  const existing = await this.userRepository.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new ConflictException('Registration failed');
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
    password: hashedPassword,
    role,
  });

  const saved = await this.userRepository.save(user);

  const { password, ...result } = saved;
  return result;
}
}