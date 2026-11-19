export class AttachmentEntity {
  constructor(
    public readonly index: number,
    public readonly url: string,
    public readonly contentType: string,
    public readonly isImage: boolean,
  ) {}
}
