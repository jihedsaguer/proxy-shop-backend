import { Injectable,NotFoundException,ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../roles/entities/role.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)    
    private rolesRepository: Repository<Role>
 
) {}

  async create(dto: CreateUserDto): Promise<User> {
    const { email, phone, username, password, roleId } = dto;

    const emailExists = await this.usersRepository.findOne({
      where: { email },
    });
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const usernameExists = await this.usersRepository.findOne({
      where: { username },
    });
    if (usernameExists) {
      throw new ConflictException('Username already exists');
    }

    if (phone) {
      const phoneExists = await this.usersRepository.findOne({
        where: { phone },
      });
      if (phoneExists) {
        throw new ConflictException('Phone already exists');
      }
    }
    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
      
    });
    
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      phone,
      username,
      password: hashedPassword,
      role,
    });

    return this.usersRepository.save(user);
  }


  //get all users 
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['role'] });
  }
    //get user by id
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

   //update users 
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
        const emailExists = await this.usersRepository.findOne({
            where: { email: dto.email },
        });
        if (emailExists) {
            throw new ConflictException('Email already exists');
        }
        user.email = dto.email;
    }
    if (dto.username && dto.username !== user.username) {
        const usernameExists = await this.usersRepository.findOne({
            where: { username: dto.username },
        });
        if (usernameExists) {
            throw new ConflictException('Username already exists');
        }
        user.username = dto.username;
    }
    if (dto.phone && dto.phone !== user.phone) {
        const phoneExists = await this.usersRepository.findOne({
            where: { phone: dto.phone },
        });
        if (phoneExists) {
            throw new ConflictException('Phone already exists');
        }
        user.phone = dto.phone;
    }
    if(dto.roleId){
        const role = await this.rolesRepository.findOne({
            where: { id: dto.roleId },
        });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        user.role = role;
    }
    if (dto.password) {
        user.password = await bcrypt.hash(dto.password, 10);
    }

    if (typeof dto.isActive === 'boolean') {
        user.isActive = dto.isActive;
    }
    return this.usersRepository.save(user);
}
   // delete users 
    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }


    async findByEmail(email: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}