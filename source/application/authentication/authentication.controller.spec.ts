import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { PATH_METADATA } from '@nestjs/common/constants';
import { UserService } from '../user/user.service.js';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: AuthenticationService, useValue: {} },
        { provide: UtilService, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: UserService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('registers both the documented and legacy authentication prefixes', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthenticationController)).toEqual(
      ['authentication', 'api/v1/auth'],
    );
  });
});
