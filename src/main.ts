import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
//import * as fs from 'fs';

// const httpsOptions =
//   process.env.NODE_ENV == 'development'
//     ? null
//     : {
//         key: fs.readFileSync('./src/cert/private.pem'),
//         cert: fs.readFileSync('./src/cert/cert.pem'),
//       };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
