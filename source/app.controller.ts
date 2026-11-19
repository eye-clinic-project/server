import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Auth } from './dependencies/decorator/index.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Auth({ optional: true })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('ping')
  @Auth({ optional: true })
  ping(): { message: string } {
    return { message: 'pong' };
  }
}
