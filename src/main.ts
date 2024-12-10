import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import { BotLoggerService } from './logs/bot-logger.service';

//import * as fs from 'fs';

// const httpsOptions =
//   process.env.NODE_ENV == 'development'
//     ? null
//     : {
//         key: fs.readFileSync('./src/cert/private.pem'),
//         cert: fs.readFileSync('./src/cert/cert.pem'),
//       };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Authorization',
    ],
    credentials: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const botLogger = app.get(BotLoggerService);
  if (botLogger) {
    app.useLogger(botLogger);
  } else {
    console.error('BotLogger не найден');
  }

  await app.listen(process.env.PORT || 5100);
}
bootstrap();
