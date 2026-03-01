import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({nullable: true, unique: true })
  firstName: string;

  @Column({nullable: true, unique: true })
  lastName: string;
  
  @Column({ nullable: true, unique: true })
  phone?: string;

  @Column({ select: false })
  password: string;

   @Column({  type: 'varchar',nullable: true })
  refreshToken: string | null;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ default: true })
  isActive: boolean;


 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}