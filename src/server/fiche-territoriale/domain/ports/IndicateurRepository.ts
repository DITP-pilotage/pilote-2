import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';

export interface IndicateurRepository {
  recupererMapIndicateursParListeChantierIdEtTerritoire: ({ listeChantierId, maille, codeInsee }: {
    listeChantierId: string[]
    maille: string
    codeInsee: string
  }) => Promise<Map<string, Indicateur[]>>

  recupererMapIndicateursNationalParListeIndicateurId: ({ listeIndicateurId }: {
    listeIndicateurId: string[]
  }) => Promise<Map<string, Indicateur>>
}
