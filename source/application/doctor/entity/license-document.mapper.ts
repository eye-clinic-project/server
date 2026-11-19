import type { ILicenseDocument } from '../../../dependencies/interface/index.js';
import { LicenseDocumentEntity } from './license-document.entity.js';

export const toLicenseDocumentEntity = (document: ILicenseDocument, index: number): LicenseDocumentEntity =>
  new LicenseDocumentEntity(index, document.originalName, document.mimeType, document.size, document.uploadedAt);
