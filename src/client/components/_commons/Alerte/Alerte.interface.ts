export type typeAlerte = 'succès' | 'erreur' | 'info' | 'warning';

export default interface AlerteProps {
  type: typeAlerte
  titre?: string
  message?: string
  classesSupplementaires? : string
  classesMessagePolice? : string
}
