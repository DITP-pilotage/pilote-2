import { ÉlémentPageType } from '@/components/Chantier/PageChantier/Sommaire/Sommaire.interface';
import Type from '@/server/domain/indicateur/Type.interface';

export type ÉlémentPageIndicateursType = ÉlémentPageType & { typeIndicateur: Type };

export interface IndicateursProps {
  indicateurs: ÉlémentPageIndicateursType[];
}
