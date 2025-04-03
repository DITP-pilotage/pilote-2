import { PerimetreMinisteriel } from '@/server/gestion-utilisateur/domain/PerimetreMinisteriel';

export interface PerimetreMinisterielRepository {
  lister(perimetresMinisterielsIds: string[]): Promise<PerimetreMinisteriel[]>
  listerIds(perimetresMinisterielsIds: string[]): Promise<string[]>
  récupérerTous(): Promise<PerimetreMinisteriel[]>
}
