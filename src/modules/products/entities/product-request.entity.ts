import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,CreateDateColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';

@Entity('product_requests')
export class ProductRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  brand: string; // nike, adidas, etc

  @Column()
  size: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ nullable: true })
  productName?: string;

  @Column({ nullable: true })
  price?: number;

  @Column({ nullable: true })
  image?: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 'pending' })
  status: string; 
  @CreateDateColumn()
  createdAt: Date;
}