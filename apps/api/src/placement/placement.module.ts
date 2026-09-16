import { Module } from '@nestjs/common';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';

@Module({
  imports: [RoadmapModule],
  controllers: [PlacementController],
  providers: [PlacementService],
  exports: [PlacementService],
})
export class PlacementModule {}
