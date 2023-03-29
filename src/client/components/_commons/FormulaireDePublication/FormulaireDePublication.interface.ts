export default interface ChampsDeSaisieProps {
  contenu?: string
  csrf: string
  libellé: string
  limiteDeCaractères: number
  onSubmit: () => void
  setContenu: (state: string) => void
  àLAnnulation: () => void
}
