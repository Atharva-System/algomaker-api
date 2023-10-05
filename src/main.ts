import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { watchCollection } from './common/helperFunc/watchCollection';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  await app.listen(process.env.port);
  watchCollection(app)
}

bootstrap();
