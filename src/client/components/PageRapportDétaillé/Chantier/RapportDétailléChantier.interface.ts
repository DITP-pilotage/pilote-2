import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import SynthèseDesRésultats from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import DécisionStratégique from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { Commentaire } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import Objectif from "@/server/domain/chantier/objectif/Objectif.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { AvancementsGlobauxTerritoriauxMoyensContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
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
  masquerIndicateursNonApplicables: boolean;
}
