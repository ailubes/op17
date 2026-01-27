import { createHash } from "crypto";

export type LiqPayCheckoutPayload = {
  public_key: string;
  version: string;
  action: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  server_url?: string;
  result_url?: string;
};

export const liqpayEncodeData = (payload: LiqPayCheckoutPayload) => {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

export const liqpaySignature = (privateKey: string, data: string) => {
  const signString = `${privateKey}${data}${privateKey}`;
  const hash = createHash("sha1").update(signString).digest();
  return Buffer.from(hash).toString("base64");
};

export const liqpayVerifySignature = (privateKey: string, data: string, signature: string) => {
  const expected = liqpaySignature(privateKey, data);
  return expected === signature;
};

export const liqpayDecodeData = (data: string) => {
  const json = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, any>;
};
