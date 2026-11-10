import { ApiOperation } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Welcome message',
    description: 'Public. Simple check that the API is reachable. Use GET /api/v1/health for monitoring.',
  })
  getHello(): object {
    return this.appService.getHello();
  }
}
