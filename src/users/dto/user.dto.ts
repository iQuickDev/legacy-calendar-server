
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({ example: 1, description: 'The user ID' })
    id: number;

    @ApiProperty({ example: 'user123', description: 'The username' })
    username: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email', required: false })
    email?: string;
}
