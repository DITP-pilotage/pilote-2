import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import { DetailsIndicateur, FichesIndicateurs } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<TypeIndicateur> };

export type IndicateurDonnéesParTerritoire = {
  territoire: string
  données: DetailsIndicateur
};

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: FichesIndicateurs
}
