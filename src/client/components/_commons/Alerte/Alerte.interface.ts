export default interface AlerteProps {
  type: 'succès' | 'erreur' | 'info' | 'warning'
  titre?: string
  message?: string
  classesSupplementaires? : string
  classesMessagePolice? : string
}
