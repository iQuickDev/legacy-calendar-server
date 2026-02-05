import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
	@ApiProperty({ example: 'user123', description: 'The username of the user (3-30 chars, alphanumeric)' })
	@IsString()
	@IsNotEmpty()
	@Length(3, 30)
	@Matches(/^[a-zA-Z0-9._-]+$/)
	username: string;

	@ApiProperty({ example: 'password123', description: 'The password of the user (min 2 chars)', minLength: 2 })
	@IsString()
	@IsNotEmpty()
	@Length(2, 30)
	password: string;
}
