import { Module } from '@nestjs/common';
import { KpiModule } from '../kpi/kpi.module';
import { PlacementModule } from '../placement/placement.module';
import { ProgressModule } from '../progress/progress.module';
import { ProjectModule } from '../projects/project.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { StudentsModule } from '../students/students.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    StudentsModule,
    PlacementModule,
    RoadmapModule,
    KpiModule,
    ProjectModule,
    ProgressModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
