export default interface FormulaireDePublicationProps {
  contenuParDéfaut?: string
  libellé: string
  limiteDeCaractères: number
  àLaSoumissionDuFormulaire: (contenuÀCréer: string, csrf: string) => void
  àLAnnulation: () => void
}
