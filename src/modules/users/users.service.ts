import { Injectable,NotFoundException,ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, phone, firstName, lastName, password, roleId } = dto;

    const emailExists = await this.usersRepository.findOne({
      where: { email },
    });
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const firstNameExists = await this.usersRepository.findOne({
      where: { firstName },
    });
    if (firstNameExists) {
      throw new ConflictException('First name already exists');
    }

    const lastNameExists = await this.usersRepository.findOne({
      where: { lastName },
    });
    if (lastNameExists) {
      throw new ConflictException('Last name already exists');
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
      firstName,
      lastName,
      password: hashedPassword,
      role,
    });

    const saved = await this.usersRepository.save(user);
    // strip password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...result } = saved as any;
    return result;
  }


  //get all users 
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find({ relations: ['role'] });
    return users.map((u) => {
      // password not selected by default thanks to entity config, but guard anyway
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = u as any;
      return rest;
    });
  }
    //get user by id
  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // remove password if it came back for any reason
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as any;
    return rest;
  }

   //update users 
  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    // fetch full entity including password so we can modify it
    const existing = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'email', 'phone', 'password', 'role', 'isActive'],
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    const user = existing as User;

    if (dto.email && dto.email !== user.email) {
        const emailExists = await this.usersRepository.findOne({
            where: { email: dto.email },
        });
        if (emailExists) {
            throw new ConflictException('Email already exists');
        }
        user.email = dto.email;
    }
    if (dto.firstName && dto.firstName !== user.firstName) {
        const firstNameExists = await this.usersRepository.findOne({
            where: { firstName: dto.firstName },
        });
        if (firstNameExists) {
            throw new ConflictException('First name already exists');
        }
        user.firstName = dto.firstName;
    }
    if (dto.lastName && dto.lastName !== user.lastName) {
        const lastNameExists = await this.usersRepository.findOne({
            where: { lastName: dto.lastName },
        });
        if (lastNameExists) {
            throw new ConflictException('Last name already exists');
        }
        user.lastName = dto.lastName;
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
    const updated = await this.usersRepository.save(user);
    // strip password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = updated as any;
    return rest;
}
   // delete users 
    async remove(id: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.usersRepository.remove(user);
    }


    async findByEmail(email: string): Promise<Omit<User, 'password'>> {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // password should never be returned
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = user as any;
        return rest;
    }
}