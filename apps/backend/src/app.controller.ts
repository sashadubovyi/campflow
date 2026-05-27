import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      name: 'CampFlow API',
      version: '0.1.0',
      docs: '/api/health',
    };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
