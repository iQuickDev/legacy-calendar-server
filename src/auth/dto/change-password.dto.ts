import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'currentPassword123', description: 'The current password of the user' })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({ example: 'newPassword123', description: 'The new password for the user', minLength: 2 })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    newPassword: string;
}
