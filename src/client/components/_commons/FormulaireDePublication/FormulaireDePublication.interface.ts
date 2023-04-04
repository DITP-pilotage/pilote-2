export default interface FormulaireDePublicationProps {
  contenuInitial?: string
  limiteDeCaractères: number
  àLaPublication: (contenuÀCréer: string, csrf: string) => void
  àLAnnulation: () => void
}
