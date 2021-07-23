export interface FileUploadRequest {
  fileName?: string;
  fileBuffer?: Buffer;
  fileExtension?: string;
  oldFileKey?: string;
}
