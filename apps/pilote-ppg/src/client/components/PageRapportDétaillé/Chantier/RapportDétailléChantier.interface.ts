import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { SynthèseDesRésultats } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { DécisionStratégique } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";
import { Commentaire } from "@/shared/chantier/commentaire/Commentaire.interface";
import { Objectif } from "@/shared/chantier/objectif/Objectif.interface";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { AvancementsGlobauxTerritoriauxMoyensContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";

export default interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire;
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  chantier: ChantierRapportDetailleContrat;
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs;
  synthèseDesRésultats: SynthèseDesRésultats;
  commentaires: Commentaire[];
  objectifs: Objectif[];
  décisionStratégique: DécisionStratégique;
  mapChantierStatistiques: Map<string, AvancementChantierRapportDetaille>;
  donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat;
  donnéesCartographieMétéo: CartographieDonnéesMétéo;
  jalon: number;
  listeIndicateursPrisEnCompteAvancement: string[];
}
