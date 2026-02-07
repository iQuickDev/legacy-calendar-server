import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);
    private initialized = false;

    constructor(private readonly prisma: PrismaService) { }

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        const firebaseConfigPath = path.join(process.cwd(), 'firebase.json');

        if (fs.existsSync(firebaseConfigPath)) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(firebaseConfigPath),
                });
                this.initialized = true;
                this.logger.log('Firebase Admin initialized successfully using firebase.json');
            } catch (error) {
                this.logger.error('Failed to initialize Firebase Admin with firebase.json', error);
            }
        } else {
            this.logger.warn(
                'Firebase credentials file (firebase.json) not found at root. Notifications will not be sent.',
            );
        }
    }

    async subscribe(userId: number, token: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { fcmToken: token },
        });
    }

    async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
        if (!this.initialized) {
            this.logger.warn('Firebase not initialized, skipping notification');
            return;
        }

        try {
            await admin.messaging().send({
                token,
                notification: { title, body },
                data,
            });
            this.logger.log(`Notification sent to ${token}`);
        } catch (error) {
            this.logger.error(`Failed to send notification to ${token}`, error);
        }
    }

    async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
        if (!this.initialized || tokens.length === 0) {
            return;
        }

        try {
            const response = await admin.messaging().sendEachForMulticast({
                tokens,
                notification: { title, body },
                data,
            });
            this.logger.log(
                `Multicast sent: ${response.successCount} success, ${response.failureCount} failure`,
            );
        } catch (error) {
            this.logger.error('Failed to send multicast notifications', error);
        }
    }
}
