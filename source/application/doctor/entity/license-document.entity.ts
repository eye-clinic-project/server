export class LicenseDocumentEntity {
  constructor(
    public readonly index: number,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly uploadedAt: Date,
  ) {}
}
