export default interface MultiSelectTerritoireProps {
  changementValeursSélectionnéesCallback: (territoiresCodesSélectionnés: string[]) => void
  territoiresCodesSélectionnésParDéfaut?: string[]
}
