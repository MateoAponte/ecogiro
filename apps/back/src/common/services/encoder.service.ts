export class EncoderService {
  encode(str: string): string {
    return btoa(str);
  }

  decode(str: string): string {
    return atob(str);
  }
}
