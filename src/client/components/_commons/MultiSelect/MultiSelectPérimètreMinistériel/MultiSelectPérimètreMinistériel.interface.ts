export default interface MultiSelectPérimètreMinistérielProps {
  changementValeursSélectionnéesCallback: (périmètresMinistérielsIdsSélectionnés: string[]) => void
  périmètresMinistérielsIdsSélectionnésParDéfaut?: string[]
  périmètresId?: string[]
}
