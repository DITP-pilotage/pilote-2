export const PREMIER_JALON = 2022;

export const buildJalons = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from(
    { length: currentYear - PREMIER_JALON + 1 },
    (_, i) => PREMIER_JALON + i,
  );
};
