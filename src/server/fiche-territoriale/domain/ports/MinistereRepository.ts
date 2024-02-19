import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';

export interface MinistereRepository {
  recupererMapMinistereParListeCodeMinistere: ({ listeCodeMinistere }: {
    listeCodeMinistere: string[]
  }) => Promise<Map<string, Ministere>>
}
