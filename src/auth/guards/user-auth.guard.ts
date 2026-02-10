import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class UserAuthGuard extends JwtAuthGuard {
    constructor(private configService: ConfigService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Check Bypass Header
        const bypassHeader = request.headers['x-bypass'];
        const bypassKey = this.configService.get<string>('BYPASS_KEY');

        if (bypassHeader && bypassHeader === bypassKey) {
            request.isBypass = true;
            return true;
        }

        // 2. Check JWT Authentication via Passport (inherited)
        try {
            const authenticated = await super.canActivate(context);
            return !!authenticated;
        } catch (e) {
            throw new UnauthorizedException('Missing or invalid authentication');
        }
    }
}
