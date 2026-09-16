import { Module } from '@nestjs/common';
import { PlacementModule } from '../placement/placement.module';
import { OrientationController } from './orientation.controller';
import { OrientationService } from './orientation.service';

@Module({
  imports: [PlacementModule],
  controllers: [OrientationController],
  providers: [OrientationService],
  exports: [OrientationService],
})
export class OrientationModule {}
