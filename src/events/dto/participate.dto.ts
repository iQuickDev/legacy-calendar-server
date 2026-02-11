
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ParticipateDto {
    @ApiProperty({ example: true, description: 'Whether the user wants food', required: false })
    @IsOptional()
    @IsBoolean()
    wantsFood?: boolean;

    @ApiProperty({ example: true, description: 'Whether the user wants weed', required: false })
    @IsOptional()
    @IsBoolean()
    wantsWeed?: boolean;

    @ApiProperty({ example: true, description: 'Whether the user wants sleep', required: false })
    @IsOptional()
    @IsBoolean()
    wantsSleep?: boolean;

    @ApiProperty({ example: true, description: 'Whether the user wants alcohol', required: false })
    @IsOptional()
    @IsBoolean()
    wantsAlcohol?: boolean;
}
