import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getRoot() {
    return {
      name: '&u API',
      version: '0.1.0',
      docs: '/api/health',
    };
  }

  @Public()
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
