import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CRM_READ_ROLES } from '../common/partnership.roles';
import { TimelineResponseDto, TimelineService } from './timeline.service';

@ApiTags('partnerships-timeline')
@ApiBearerAuth('JWT')
@Controller('partnerships/institutions')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get(':id/timeline')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: TimelineResponseDto })
  getTimeline(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TimelineResponseDto> {
    return this.timelineService.getInstitutionTimeline(id);
  }
}
