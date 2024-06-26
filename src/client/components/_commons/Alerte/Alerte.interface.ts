export default interface AlerteProps {
  type: 'succès' | 'erreur' | 'warning'
  titre: string
  message?: string
}
