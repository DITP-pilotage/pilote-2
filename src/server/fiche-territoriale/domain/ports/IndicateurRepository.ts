import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';

export interface IndicateurRepository {
  recupererMapIndicateursParListeChantierIdEtTerritoire: ({ listeChantierId, maille, codeInsee }: {
    listeChantierId: string[]
    maille: string
    codeInsee: string
    jalon: number
  }) => Promise<Map<string, Indicateur[]>>

  recupererMapIndicateursNationalParListeIndicateurId: ({ listeIndicateurId }: {
    listeIndicateurId: string[]
    jalon: number
  }) => Promise<Map<string, Indicateur>>
}
