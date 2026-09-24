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
  CreateOfferingDto,
  OfferingResponseDto,
  PaginatedOfferingsDto,
  QueryOfferingsDto,
  UpdateOfferingDto,
} from './dto/offering.dto';
import { OfferingsService } from './offerings.service';

@ApiTags('partnerships-offerings')
@ApiBearerAuth('JWT')
@Controller('partnerships/offerings')
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedOfferingsDto })
  findAll(@Query() query: QueryOfferingsDto): Promise<PaginatedOfferingsDto> {
    return this.offeringsService.findAll(query);
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: OfferingResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<OfferingResponseDto> {
    return this.offeringsService.findOne(id);
  }

  @Post()
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OfferingResponseDto })
  create(
    @Body() dto: CreateOfferingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferingResponseDto> {
    return this.offeringsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: OfferingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOfferingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferingResponseDto> {
    return this.offeringsService.update(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: OfferingResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferingResponseDto> {
    return this.offeringsService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: OfferingResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferingResponseDto> {
    return this.offeringsService.duplicate(id, user.id);
  }
}
