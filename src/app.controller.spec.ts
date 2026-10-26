import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the hello message after the simulated delay', async () => {
      vi.useFakeTimers();
      try {
        const response = appController.getHello();
        await vi.advanceTimersByTimeAsync(20_000);

        await expect(response).resolves.toEqual({
          message: 'hello from backend server',
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
