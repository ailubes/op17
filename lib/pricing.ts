import { Currency } from "@prisma/client";

export const roundWhole = (value: number) => Math.round(value);

export const toMinorUnits = (amountWhole: number, currency: Currency) => {
  if (currency === Currency.UAH || currency === Currency.USD || currency === Currency.EUR) {
    return amountWhole * 100;
  }
  return amountWhole * 100;
};

export const convertFromEur = (basePriceEur: number, rate: number) => {
  return roundWhole(basePriceEur * rate);
};

