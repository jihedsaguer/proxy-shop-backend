import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { permission } from 'process';
import { Permission } from '../permissions/entities/permission.entity';
@Injectable()
export class RolesService {
    constructor(
         @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
         @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>
               
) {}

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const exists = await this.roleRepository.exists({ where: { name: createRoleDto.name } });
        if (exists) {
            throw new ConflictException('Role with this name already exists');
        }
        const role = this.roleRepository.create(createRoleDto);
        return this.roleRepository.save(role);
    }

    async findAll(): Promise<Role[]> {
        return this.roleRepository.find();
    }

    async findOne(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);
        if (updateRoleDto.name) {
            const existing = await this.roleRepository.findOne({ where: { name: updateRoleDto.name } });
            if (existing && existing.id !== id) {
                throw new ConflictException('Another role with this name already exists');
            }
        }
        Object.assign(role, updateRoleDto);
        return this.roleRepository.save(role);
    }

    async remove(id: string): Promise<void> {
        const role = await this.findOne(id);
        await this.roleRepository.remove(role);
    }


    async assignPermissions( roleId: string, permissionIds: string[],): Promise<Role> {
  const role = await this.findOne(roleId);

  const permissions = await this.permissionRepository.findBy({
    id: In(permissionIds),
  });

  if (permissions.length !== permissionIds.length) {
    throw new NotFoundException('One or more permissions not found');
  }

  role.permissions = permissions;

  return this.roleRepository.save(role);
}
    }
