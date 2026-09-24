import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import {
  ChangeProposalStatusDto,
  CreateProposalDto,
  PaginatedProposalsDto,
  ProposalResponseDto,
  QueryProposalsDto,
  UpdateProposalDto,
} from './dto/proposal.dto';
import { ProposalsService } from './proposals.service';

@ApiTags('partnerships-proposals')
@ApiBearerAuth('JWT')
@Controller('partnerships/proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedProposalsDto })
  findAll(@Query() query: QueryProposalsDto): Promise<PaginatedProposalsDto> {
    return this.proposalsService.findAll(query);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProposalResponseDto> {
    return this.proposalsService.findOne(id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ProposalResponseDto })
  create(
    @Body() dto: CreateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.update(id, dto, user.id);
  }

  @Post(':id/send')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  send(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.send(id, user.id);
  }

  @Post(':id/status')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeProposalStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.changeStatus(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ProposalResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.duplicate(id, user.id);
  }

  @Post(':id/revise')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  revise(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.revise(id, user.id);
  }

  @Post(':id/share-token')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ProposalResponseDto })
  shareToken(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.ensureShareToken(id, user.id);
  }
}
