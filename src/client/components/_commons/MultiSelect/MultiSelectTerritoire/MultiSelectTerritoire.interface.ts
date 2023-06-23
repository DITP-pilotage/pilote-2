export default interface MultiSelectTerritoireProps {
  changementValeursSélectionnéesCallback: (territoiresCodesSélectionnés: string[]) => void
  territoiresCodesSélectionnésParDéfaut?: string[]
  mailleÀAfficher: {
    nationale: boolean
    régionale: boolean
    départementale: boolean
  }
}
