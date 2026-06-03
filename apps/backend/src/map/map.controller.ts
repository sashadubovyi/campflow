import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { MapService } from './map.service';

@Controller('map')
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('points')
  async getPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.mapService.getUserLocationPoints(user.id);
  }
}
