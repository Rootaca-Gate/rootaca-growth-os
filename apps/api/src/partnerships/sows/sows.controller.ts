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
  ChangeSowStatusDto,
  CreateChangeRequestDto,
  CreateSowDto,
  CreateSowFromProposalDto,
  DecideChangeRequestDto,
  PaginatedSowsDto,
  QuerySowsDto,
  SowResponseDto,
  UpdateSowDto,
} from './dto/sow.dto';
import { SowsService } from './sows.service';

@ApiTags('partnerships-sows')
@ApiBearerAuth('JWT')
@Controller('partnerships/sows')
export class SowsController {
  constructor(private readonly sowsService: SowsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedSowsDto })
  findAll(@Query() query: QuerySowsDto): Promise<PaginatedSowsDto> {
    return this.sowsService.findAll(query);
  }

  @Post('create-from-proposal')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: SowResponseDto })
  createFromProposal(
    @Body() dto: CreateSowFromProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.createFromProposal(dto.proposalId, user.id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: SowResponseDto })
  create(
    @Body() dto: CreateSowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.create(dto, user.id);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: SowResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<SowResponseDto> {
    return this.sowsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: SowResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.update(id, dto, user.id);
  }

  @Post(':id/status')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: SowResponseDto })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeSowStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.changeStatus(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: SowResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: SowResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.duplicate(id, user.id);
  }

  @Post(':id/change-requests')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: SowResponseDto })
  createChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.createChangeRequest(id, dto, user.id);
  }

  @Post(':id/change-requests/:crId/decide')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: SowResponseDto })
  decideChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('crId', new ParseUUIDPipe()) crId: string,
    @Body() dto: DecideChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SowResponseDto> {
    return this.sowsService.decideChangeRequest(id, crId, dto, user.id);
  }
}
