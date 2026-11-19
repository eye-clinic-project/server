import { Matches } from 'class-validator';
import { i18nValidationMessage } from '@nestjs/i18n';

export class DaySlotsDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: i18nValidationMessage('validation.custom.dateFormat') })
  date!: string;
}
