export default interface MultiSelectTerritoireProps {
  changementValeursSélectionnéesCallback: (territoiresCodesSélectionnés: string[]) => void
  territoiresCodesSélectionnésParDéfaut?: string[]
  groupesÀAfficher: {
    nationale: boolean
    régionale: boolean
    départementale: boolean
  },
  territoiresSélectionnables?: string[],
  afficherBoutonsSélection?: boolean,
}
