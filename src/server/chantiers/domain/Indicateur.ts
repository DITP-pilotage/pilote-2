export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'] as const;

export type TypeIndicateur = typeof typesIndicateur[number];

export interface Indicateur {
  id: string
  nom: string
  type: TypeIndicateur
  estIndicateurDuBaromètre: boolean
  description: string | null
  source: string | null
  modeDeCalcul: string | null
  unité: string | null
  parentId: string | null
  periodicite: string | null
  delaiDisponibilite: string | null
  responsablesDonneesMails: string[]
}
