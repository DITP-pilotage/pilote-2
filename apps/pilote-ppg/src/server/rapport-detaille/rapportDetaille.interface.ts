import { Axe } from "@/shared/axe/Axe.interface";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { SynthèseDesRésultats } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { Objectif } from "@/shared/chantier/objectif/Objectif.interface";
import { Commentaire } from "@/shared/chantier/commentaire/Commentaire.interface";
import { DécisionStratégique } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";
import { Territoire } from "@/shared/territoire/Territoire.interface";
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
  selectedTerritoire: Territoire;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  moyenneTauxAvancementTerritoire: number | null;
  estAutoriseAVoirLesBrouillons: boolean;
  chantiersSontArchives: boolean;
};

export type ChantierDetail = {
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

export type ChantierRapportDetailleWithoutMailles = Omit<
  ChantierRapportDetailleContrat,
  "mailles"
>;

export type SerializedVueDEnsemble = Omit<
  VueDEnsembleRapportDetaille,
  "chantiers"
> & {
  chantiers: ChantierRapportDetailleWithoutMailles[];
};
