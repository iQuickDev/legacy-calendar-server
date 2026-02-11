import { Controller, Get, Param, Res, StreamableFile, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

@Controller('uploads')
export class UploadsController {
    constructor(private configService: ConfigService) { }

    @Get(':category/:filename')
    async getUpload(
        @Param('category') category: string,
        @Param('filename') filename: string,
        @Res() res: Response,
    ) {
        const filePath = join(process.cwd(), 'uploads', category, filename);

        if (existsSync(filePath)) {
            // Serve locally if exists
            const file = createReadStream(filePath);
            file.pipe(res);
            return;
        }

        // Fallback to remote if configured
        const remoteUrl = this.configService.get<string>('REMOTE_UPLOADS_URL');
        if (remoteUrl) {
            const sanitizedRemoteUrl = remoteUrl.endsWith('/') ? remoteUrl.slice(0, -1) : remoteUrl;
            return res.redirect(`${sanitizedRemoteUrl}/uploads/${category}/${filename}`);
        }

        throw new NotFoundException('File not found');
    }
}
