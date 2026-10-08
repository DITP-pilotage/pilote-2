import {
  CategoriesIndicateur,
  ÉlémentPageIndicateursType,
} from "@/client/utils/rubriques";
import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";

export default interface RubriquesIndicateursProps {
  détailsIndicateurs: DétailsIndicateurs;
  indicateurs: Indicateur[];
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[];
  territoireCode?: string;
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>;
  jalon: number;
}
