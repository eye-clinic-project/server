import { FileValidator, Injectable } from '@nestjs/common';



export class ExtensionValidator extends FileValidator<{allowedExtensions: string[]}> {
  
    buildErrorMessage(): string {
    return `File extension must be one of: ${this.validationOptions.allowedExtensions.join(', ')}`;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;

    const extension = file.originalname
      .split('.')
      .pop()
      ?.toLowerCase();

    return !!extension &&
      this.validationOptions.allowedExtensions.includes(`.${extension}`);
  }
}

