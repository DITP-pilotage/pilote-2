export default interface MultiSelectChantierProps {
  changementValeursSélectionnéesCallback: (territoiresCodesSélectionnés: string[]) => void
  chantiersIdsSélectionnésParDéfaut?: string[]
}
