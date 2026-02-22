import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Body, Param, Patch } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Controller('permissions')
export class PermissionsController {

    constructor(private readonly permissionsService: PermissionsService) {}

    @Post('create')
      async create(@Body() createPermissionDto: CreatePermissionDto) {
        return this.permissionsService.create(createPermissionDto);
      }


      @Get()
        async findAll() {
            return this.permissionsService.findAll();
        }

        @Get(':id')
        async findOne(@Param('id') id: string) {
            return this.permissionsService.findOne(id);
        }

        @Patch(':id')
        update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
        return this.permissionsService.update(id, dto);
        }

        @Delete(':id')
        async remove(@Param('id') id: string) {
            return this.permissionsService.remove(id);
        }



}
