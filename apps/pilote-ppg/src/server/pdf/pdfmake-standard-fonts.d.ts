/**
 * `@types/pdfmake` ne couvre pas `build/standard-fonts/*`, où pdfmake 0.3 a sorti les
 * métriques des polices PDF standard. Chaque module y expose un conteneur au format
 * attendu par `addFontContainer`.
 */
declare module "pdfmake/build/standard-fonts/Courier" {
  const conteneurPolice: import("pdfmake/interfaces").TFontContainer;
  export default conteneurPolice;
}
