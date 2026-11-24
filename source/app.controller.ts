import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Auth } from './dependencies/decorator/auth.decorator.js';
import { NotificationService } from './dependencies/service/notification.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly notificationService: NotificationService,
  ) {}

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
