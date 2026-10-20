import {
  BadRequestException,
  FileTypeValidator,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';

export const MAX_SCAN_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ScanImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class ScanImagePipe implements PipeTransform {
  async transform(file?: ScanImageFile): Promise<ScanImageFile> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes enviar una foto en el campo file.');
    }
    if (file.buffer.length > MAX_SCAN_IMAGE_BYTES) {
      throw new PayloadTooLargeException('La foto no puede superar 5 MB.');
    }
    const validator = new FileTypeValidator({
      fileType: /^image\/(jpeg|png|webp)$/,
    });
    if (!(await validator.isValid(file))) {
      throw new BadRequestException(
        'La foto debe ser una imagen JPEG, PNG o WEBP válida.',
      );
    }
    // Use the detected format rather than trusting the client-supplied MIME.
    const mimetype = file.buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'image/png'
      : file.buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        ? 'image/jpeg'
        : 'image/webp';
    return { ...file, mimetype, size: file.buffer.length };
  }
}
