import { Module } from '@nestjs/common';
import { PartnershipAuditService } from './common/partnership-audit.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { PartnershipDashboardController } from './dashboard/dashboard.controller';
import { PartnershipDashboardService } from './dashboard/dashboard.service';
import { FollowUpsController } from './followups/followups.controller';
import { FollowUpsService } from './followups/followups.service';
import { ImportController } from './import/import.controller';
import { ImportService } from './import/import.service';
import { InstitutionsController } from './institutions/institutions.controller';
import { InstitutionsService } from './institutions/institutions.service';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './notes/notes.service';
import { ResearchController } from './research/research.controller';
import { ResearchService } from './research/research.service';
import { SourcesController } from './sources/sources.controller';
import { SourcesService } from './sources/sources.service';
import { TimelineController } from './timeline/timeline.controller';
import { TimelineService } from './timeline/timeline.service';

@Module({
  controllers: [
    InstitutionsController,
    ContactsController,
    LeadsController,
    ActivitiesController,
    FollowUpsController,
    NotesController,
    SourcesController,
    TimelineController,
    PartnershipDashboardController,
    ImportController,
    ResearchController,
  ],
  providers: [
    PartnershipAuditService,
    InstitutionsService,
    ContactsService,
    LeadsService,
    ActivitiesService,
    FollowUpsService,
    NotesService,
    SourcesService,
    TimelineService,
    PartnershipDashboardService,
    ImportService,
    ResearchService,
  ],
  exports: [
    InstitutionsService,
    LeadsService,
    PartnershipAuditService,
    ImportService,
    ResearchService,
  ],
})
export class PartnershipsModule {}
