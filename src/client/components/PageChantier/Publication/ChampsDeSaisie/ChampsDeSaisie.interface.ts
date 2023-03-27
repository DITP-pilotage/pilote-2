export default interface ChampsDeSaisieProps {
  contenu?: string
  libellé: string
  limiteDeCaractères: number
  setContenu: (state: string) => void
}
