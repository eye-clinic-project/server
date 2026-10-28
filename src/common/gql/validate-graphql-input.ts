import { BadRequestException, type Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';

export interface LocalizedValidationError {
  field: string;
  message: string;
}

export function formatValidationErrors(
  errors: ValidationError[],
  parent = '',
): LocalizedValidationError[] {
  const i18n = I18nContext.current();
  return errors.flatMap((error): LocalizedValidationError[] => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    return [
      ...Object.keys(error.constraints ?? {}).map((constraint) => ({
        field,
        message:
          i18n?.translate(`validation.${constraint}`) ??
          error.constraints?.[constraint] ??
          'Invalid value',
      })),
      ...formatValidationErrors(error.children ?? [], field),
    ];
  });
}

export async function validateGraphqlInput<T extends object>(
  input: unknown,
  inputType: Type<T>,
): Promise<T> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new BadRequestException('Input must be an object');
  }

  const instance = plainToInstance(inputType, input);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    throw new BadRequestException({
      message:
        I18nContext.current()?.translate('validation.invalid') ??
        'Validation failed',
      errors: formatValidationErrors(errors),
    });
  }
  return instance;
}
