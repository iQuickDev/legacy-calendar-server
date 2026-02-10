import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const httpsOptions = getHttpsOptions(logger);

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Legacy Calendar API')
    .setDescription('The legacy calendar server API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const protocol = httpsOptions ? 'https' : 'http';
  logger.log(`Application is running on: ${protocol}://localhost:${port}`);
}

function getHttpsOptions(logger: Logger) {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;

  if (keyPath && certPath) {
    try {
      const keyFile = path.resolve(process.cwd(), keyPath);
      const certFile = path.resolve(process.cwd(), certPath);

      if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
        logger.log(`SSL configuration found. Loading certificates...`);
        return {
          key: fs.readFileSync(keyFile),
          cert: fs.readFileSync(certFile),
        };
      } else {
        logger.warn(
          `SSL paths provided but files not found: ${keyFile}, ${certFile}. Falling back to HTTP.`,
        );
      }
    } catch (error) {
      logger.error('Error loading SSL certificates, falling back to HTTP.', error.stack);
    }
  }

  return undefined;
}

bootstrap();
