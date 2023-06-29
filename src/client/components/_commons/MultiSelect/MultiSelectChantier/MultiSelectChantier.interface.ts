export default interface MultiSelectChantierProps {
  changementValeursSélectionnéesCallback: (chantiersIdsSélectionnés: string[]) => void
  chantiersIdsSélectionnésParDéfaut?: string[]
  valeursDésactivées?: string[]
}
