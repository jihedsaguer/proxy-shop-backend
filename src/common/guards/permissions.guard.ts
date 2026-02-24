import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { In } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    
    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.permissions) {
            throw new ForbiddenException('User has no permissions');
        }

        const hasPermission = requiredPermissions.some((permission) => user.permissions.includes(permission));
        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permission');
        }

        return true;
    }
}