import type { ILicenseDocument } from '../../../dependencies/interface/database.interface.js';

export class LicenseDocumentEntity {
  constructor(
    public readonly index: number,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly uploadedAt: Date,
  ) {}
}

export const toLicenseDocumentEntity = (document: ILicenseDocument, index: number): LicenseDocumentEntity =>
  new LicenseDocumentEntity(index, document.originalName, document.mimeType, document.size, document.uploadedAt);
