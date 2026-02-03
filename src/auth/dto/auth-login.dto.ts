import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthLoginDto {
    @ApiProperty({ example: 'user123', description: 'The username of the user' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'password123', description: 'The password of the user', minLength: 8 })
    @IsString()
    @IsNotEmpty()
    password: string;
}
