export const px = (valeur: number) => valeur * 0.75;
export const rem = (valeur: number) => valeur * 12;
export const mm = (valeur: number) => (valeur * 72) / 25.4;

const MARIANNE_NATURAL_LINE_HEIGHT = 1.5;

export const cssLineHeight = (lineHeight: number, fontSize: number) =>
  lineHeight / fontSize / MARIANNE_NATURAL_LINE_HEIGHT;
