import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}
