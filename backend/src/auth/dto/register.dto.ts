export class RegisterDto {
  role!: 'CONSULTANT' | 'CLIENT';
  firstName!: string;
  lastName!: string;
  email!: string;
  phone!: string;
  password!: string;
  // optional: when client registers from invite link, attach storeSlug
  storeSlug?: string;
}


