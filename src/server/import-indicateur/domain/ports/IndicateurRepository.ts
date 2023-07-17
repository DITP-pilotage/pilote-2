import { InformationIndicateur } from '@/server/import-indicateur/domain/InformationIndicateur';

export interface IndicateurRepository {
  recupererInformationIndicateurParId(indicId: string): Promise<InformationIndicateur>
}
