import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService - Reset Password', () => {
  let service: AuthService;
  let userRepository: any;
  let roleRepository: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
    refreshToken: null,
    resetToken: null,
    resetTokenExpiresAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('requestPasswordReset', () => {
    it('should return success message for non-existent email (security)', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.requestPasswordReset({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('If an account exists with this email');
    });

    it('should return success message for inactive user (security)', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.requestPasswordReset({ email: 'test@example.com' });

      expect(result.message).toContain('If an account exists with this email');
    });

    it('should generate reset token and set expiration for active user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.requestPasswordReset({ email: 'test@example.com' });

      expect(result.message).toContain('If an account exists with this email');
      expect(userRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiresAt: expect.any(Date),
        })
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('should throw error for invalid token', async () => {
      const mockQuery = {
        getOne: jest.fn().mockResolvedValue(null),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQuery);

      await expect(
        service.confirmPasswordReset({ token: 'invalid-token', newPassword: 'newpass123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for expired token', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);
      
      const userWithExpiredToken = {
        ...mockUser,
        resetToken: 'some-hash',
        resetTokenExpiresAt: expiredDate,
      };

      const mockQuery = {
        getOne: jest.fn().mockResolvedValue(userWithExpiredToken),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQuery);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.confirmPasswordReset({ token: 'reset-token', newPassword: 'newpass123' })
      ).rejects.toThrow('Reset token has expired');

      // Verify token was cleared
      expect(userRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          resetToken: null,
          resetTokenExpiresAt: null,
        })
      );
    });

    it('should successfully reset password with valid token', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const userWithValidToken = {
        ...mockUser,
        resetToken: await bcrypt.hash('reset-token-123', 10),
        resetTokenExpiresAt: futureDate,
      };

      const mockQuery = {
        getOne: jest.fn().mockResolvedValue(userWithValidToken),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQuery);
      userRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.confirmPasswordReset({
        token: 'reset-token-123',
        newPassword: 'newpassword123',
      });

      expect(result.message).toContain('successfully reset');
      expect(userRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          password: expect.any(String),
          resetToken: null,
          resetTokenExpiresAt: null,
        })
      );
    });

    it('should throw error for mismatched token', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const userWithValidToken = {
        ...mockUser,
        resetToken: await bcrypt.hash('correct-token', 10),
        resetTokenExpiresAt: futureDate,
      };

      const mockQuery = {
        getOne: jest.fn().mockResolvedValue(userWithValidToken),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQuery);

      await expect(
        service.confirmPasswordReset({
          token: 'wrong-token',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow('Invalid reset token');
    });
  });
});
