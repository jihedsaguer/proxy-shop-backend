import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
@Injectable()
export class RolesService {
    constructor( @InjectRepository(Role) private readonly roleRepository: Repository<Role>) {}

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepository.findOne({ where: { name: createRoleDto.name } });
        if (existing) {
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
    async update(id: string, updateRoleDto: CreateRoleDto): Promise<Role> {
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
    
}
