import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [ConfigModule],
  providers: [],
})
export class CommoneModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
