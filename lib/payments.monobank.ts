import { createVerify } from "crypto";

const normalizePem = (base64: string) => {
  const sanitized = base64.replace(/\s+/g, "");
  const lines = sanitized.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
};

export const verifyMonobankSignature = (payload: string, signatureBase64: string, publicKeyBase64: string) => {
  if (!signatureBase64 || !publicKeyBase64) {
    return false;
  }

  const verifier = createVerify("sha256");
  verifier.update(payload);
  verifier.end();

  const signature = Buffer.from(signatureBase64, "base64");
  const pem = normalizePem(publicKeyBase64);

  return verifier.verify(pem, signature);
};

export const toMonobankCurrency = (currency: string) => {
  if (currency === "UAH") return 980;
  if (currency === "USD") return 840;
  if (currency === "EUR") return 978;
  return null;
};
