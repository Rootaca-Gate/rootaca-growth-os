import {
  Body,
  Controller,
  Delete,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import { ContactsService } from './contacts.service';
import {
  ContactResponseDto,
  CreateContactDto,
  PaginatedContactsDto,
  QueryContactsDto,
  UpdateContactDto,
} from './dto/contact.dto';

@ApiTags('partnerships-contacts')
@ApiBearerAuth('JWT')
@Controller('partnerships')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('contacts')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'List contacts' })
  @ApiOkResponse({ type: PaginatedContactsDto })
  findAll(@Query() query: QueryContactsDto): Promise<PaginatedContactsDto> {
    return this.contactsService.findAll(query);
  }

  @Get('institutions/:institutionId/contacts')
  @Roles(...CRM_READ_ROLES)
  @ApiOperation({ summary: 'List contacts for an institution' })
  @ApiOkResponse({ type: PaginatedContactsDto })
  findByInstitution(
    @Param('institutionId', new ParseUUIDPipe()) institutionId: string,
    @Query() query: QueryContactsDto,
  ): Promise<PaginatedContactsDto> {
    return this.contactsService.findByInstitution(institutionId, query);
  }

  @Get('contacts/:id')
  @Roles(...CRM_READ_ROLES)
  @ApiOkResponse({ type: ContactResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ContactResponseDto> {
    return this.contactsService.findOne(id);
  }

  @Post('contacts')
  @Roles(...CRM_WRITE_ROLES)
  @ApiCreatedResponse({ type: ContactResponseDto })
  create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactResponseDto> {
    return this.contactsService.create(dto, user.id);
  }

  @Patch('contacts/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ContactResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactResponseDto> {
    return this.contactsService.update(id, dto, user.id);
  }

  @Delete('contacts/:id')
  @Roles(...CRM_WRITE_ROLES)
  @ApiOkResponse({ type: ContactResponseDto })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactResponseDto> {
    return this.contactsService.remove(id, user.id);
  }
}
