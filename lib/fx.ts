import { Prisma, Currency } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

type EcbRates = {
  asOf: Date;
  rates: Record<string, string>;
};

export const fetchEcbRates = async (): Promise<EcbRates> => {
  const response = await fetch(ECB_DAILY_URL, {
    cache: "no-store",
    headers: {
      "User-Agent": "op17-shop-fx-updater",
    },
  });

  if (!response.ok) {
    throw new Error(`ECB fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const dateMatch = xml.match(/time='(\d{4}-\d{2}-\d{2})'/);
  if (!dateMatch) {
    throw new Error("ECB date not found");
  }

  const asOf = new Date(dateMatch[1]);
  const rateMatches = [...xml.matchAll(/currency='([A-Z]{3})'\s+rate='([0-9.]+)'/g)];
  const rates: Record<string, string> = {};

  for (const match of rateMatches) {
    rates[match[1]] = match[2];
  }

  return { asOf, rates };
};

export const upsertFxRates = async (payload: EcbRates) => {
  const targets: Currency[] = [Currency.USD, Currency.UAH];
  const updates = targets
    .filter((currency) => payload.rates[currency])
    .map((currency) =>
      prisma.fxRate.upsert({
        where: {
          baseCurrency_quoteCurrency: {
            baseCurrency: Currency.EUR,
            quoteCurrency: currency,
          },
        },
        update: {
          rate: new Prisma.Decimal(payload.rates[currency]),
          source: "ECB",
          asOf: payload.asOf,
        },
        create: {
          baseCurrency: Currency.EUR,
          quoteCurrency: currency,
          rate: new Prisma.Decimal(payload.rates[currency]),
          source: "ECB",
          asOf: payload.asOf,
        },
      })
    );

  return Promise.all(updates);
};

