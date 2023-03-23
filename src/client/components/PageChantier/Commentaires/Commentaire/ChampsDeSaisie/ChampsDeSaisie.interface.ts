export default interface ChampsDeSaisieProps {
  contenu: string | undefined
  libellé: string
  limiteDeCaractères: number
  setContenu: (state: string) => void
}
