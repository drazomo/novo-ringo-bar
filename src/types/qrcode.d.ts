declare module "qrcode" {
  type Opts = { type?: string; errorCorrectionLevel?: "L" | "M" | "Q" | "H"; margin?: number; width?: number; color?: { dark?: string; light?: string } };
  const QRCode: { toString(text: string, opts?: Opts): Promise<string>; toBuffer(text: string, opts?: Opts): Promise<Buffer> };
  export default QRCode;
}
