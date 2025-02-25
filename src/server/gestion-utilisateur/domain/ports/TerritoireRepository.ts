import { Territoire } from '@/server/gestion-utilisateur/domain/Territoire';

export interface TerritoireRepository {
  lister(codes: string[]): Promise<Territoire[]>
  listerCodes(codes: string[]): Promise<string[]>
}
