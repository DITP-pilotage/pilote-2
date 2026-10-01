import Axe from "@/server/domain/axe/Axe.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import SynthèseDesRésultats from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import Objectif from "@/server/domain/chantier/objectif/Objectif.interface";
import { Commentaire } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { DécisionStratégique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";

export type VueDEnsembleRapportDetaille = {
  chantiers: ChantierRapportDetailleContrat[];
  ministères: Ministère[];
  axes: Axe[];
  territoireSélectionné: Territoire;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  moyenneTauxAvancementTerritoire: number | null;
  estAutoriseAVoirLesBrouillons: boolean;
  chantiersSontArchives: boolean;
};

export type DetailChantierRapportDetaille = {
  chantierId: string;
  avancement: AvancementChantierRapportDetaille;
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs;
  synthèseDesRésultats: SynthèseDesRésultats | null;
  objectifs: Objectif[];
  commentaires: Commentaire[];
  décisionStratégique: DécisionStratégique | null;
  donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat;
  donnéesCartographieMétéo: CartographieDonnéesMétéo;
  listeIndicateursPrisEnCompteAvancement: string[];
};

export type ChantierRapportDetailleSansMailles = Omit<
  ChantierRapportDetailleContrat,
  "mailles"
>;

export type VueDEnsembleRapportDetailleSerialisee = Omit<
  VueDEnsembleRapportDetaille,
  "chantiers"
> & {
  chantiers: ChantierRapportDetailleSansMailles[];
};
