export interface IFile extends Express.Multer.File {
  finalPath?: string;
}
