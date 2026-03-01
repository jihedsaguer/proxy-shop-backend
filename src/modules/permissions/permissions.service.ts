import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}
 
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: { action: createPermissionDto.action },
    });

    if (existing) {
      throw new ConflictException('Permission with this action already exists');
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }


  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }


  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  
  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    if (updatePermissionDto.action) {
      const existing = await this.permissionRepository.findOne({
        where: { action: updatePermissionDto.action },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Another permission with this action already exists');
      }
    }

    Object.assign(permission, updatePermissionDto);

    return this.permissionRepository.save(permission);
  }


  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }
}