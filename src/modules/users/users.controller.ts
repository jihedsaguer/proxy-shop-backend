import { Controller, Delete, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Body, Param, Patch,Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../roles/entities/role.entity';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('create')
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
      }

      @Get()
        async findAll() {
            return this.usersService.findAll();
        }

        @Get(':id')
        async findOne(@Param('id') id: string) {
            return this.usersService.findOne(id);
        }
        @Delete(':id')
        async remove(@Param('id') id: string) {
            return this.usersService.remove(id);
        }

}
