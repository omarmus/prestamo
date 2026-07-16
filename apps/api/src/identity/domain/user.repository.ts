import { Email } from './email.value-object';
import { User } from './user.entity';

export interface UserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
