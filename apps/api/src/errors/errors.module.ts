import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorEvent } from './entities/error-event.entity';
import { ErrorsService } from './errors.service';
import { ErrorsController } from './errors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorEvent])],
  providers: [ErrorsService],
  controllers: [ErrorsController],
  exports: [ErrorsService],
})
export class ErrorsModule {}
