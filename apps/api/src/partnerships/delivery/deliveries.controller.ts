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
import { DeliveriesService } from './deliveries.service';
import {
  ChangeDeliveryStatusDto,
  CreateDeliveryFromSowDto,
  DeliveryResponseDto,
  DeliveryUserOptionDto,
  PaginatedDeliveriesDto,
  QueryDeliveriesDto,
  UpdateDeliveryDto,
} from './dto/delivery.dto';

@ApiTags('partnerships-delivery')
@ApiBearerAuth('JWT')
@Controller('partnerships/delivery')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: PaginatedDeliveriesDto })
  findAll(@Query() query: QueryDeliveriesDto): Promise<PaginatedDeliveriesDto> {
    return this.deliveriesService.findAll(query);
  }

  // Static routes must precede the dynamic ":id" route below.
  @Post('create-from-sow')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  createFromSow(
    @Body() dto: CreateDeliveryFromSowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.createFromSow(dto, user.id);
  }

  @Get('users')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: [DeliveryUserOptionDto] })
  listUsers(): Promise<DeliveryUserOptionDto[]> {
    return this.deliveriesService.listUsers();
  }

  @Get(':id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: DeliveryResponseDto })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: DeliveryResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.update(id, dto, user.id);
  }

  @Post(':id/status')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: DeliveryResponseDto })
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeDeliveryStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.changeStatus(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: DeliveryResponseDto })
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.duplicate(id, user.id);
  }
}
