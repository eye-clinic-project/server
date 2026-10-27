import { Body, Controller, Patch, Param, Delete } from '@nestjs/common';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { MessageService } from './message.service.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';

@Controller('message')
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Patch(':messageId')
  update(
    @User() user: HUserDocument,
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.update(
      user._id.toString(),
      messageId,
      updateMessageDto,
    );
  }

  @Delete(':messageId')
  remove(@User() user: HUserDocument, @Param('messageId') messageId: string) {
    return this.messageService.remove(user._id.toString(), messageId);
  }
}
