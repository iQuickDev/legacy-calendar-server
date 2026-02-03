import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BypassGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const bypassHeader = request.headers['x-bypass'];
        const bypassKey = this.configService.get<string>('BYPASS_KEY');

        if (!bypassHeader || bypassHeader !== bypassKey) {
            throw new UnauthorizedException('Missing or invalid X-Bypass header');
        }

        return true;
    }
}
