import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.contactsService.listContacts(user.id);
  }

  @Post()
  add(@CurrentUser() user: AuthenticatedUser, @Body() body: { contactId: string }) {
    return this.contactsService.addContact(user.id, body.contactId);
  }

  @Delete(':contactId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('contactId') contactId: string) {
    return this.contactsService.removeContact(user.id, contactId);
  }
}
