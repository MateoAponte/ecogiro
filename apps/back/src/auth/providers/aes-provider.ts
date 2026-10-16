import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AesProvider {
  IV_LEN = 16;
  b64u = (b: Buffer): string =>
    b
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  fromB64u = (s: string): Buffer =>
    Buffer.from(
      s
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(s.length / 4) * 4, '='),
      'base64',
    );

  checkKey(key: string): void {
    if (key.length !== 32) {
      throw new Error('Invalid key length');
    }
  }

  encrypt(plain: string, key: string): string {
    this.checkKey(key);
    const iv = crypto.randomBytes(this.IV_LEN);
    const c = crypto.createCipheriv('aes-256-ctr', key, iv);
    const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return `v1.${this.b64u(Buffer.concat([iv, ct]))}`;
  }

  decrypt(token: string, key: string): string {
    this.checkKey(key);
    const [, packedB64] = token.split('.');
    const packed = this.fromB64u(packedB64);
    const iv = packed.subarray(0, this.IV_LEN);
    const ct = packed.subarray(this.IV_LEN);
    const d = crypto.createDecipheriv('aes-256-ctr', key, iv);
    const out = Buffer.concat([d.update(ct), d.final()]);
    return out.toString('utf8');
  }
}
