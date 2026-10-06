import { Chantier } from "@/shared/chantier/Chantier.interface";
import { SynthèseDesRésultats } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { Commentaire } from "@/shared/chantier/commentaire/Commentaire.interface";
import { Objectif } from "@/shared/chantier/objectif/Objectif.interface";
import { DécisionStratégique } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";

export type PublicationsGroupéesParChantier = {
  commentaires: Record<Chantier["id"], Commentaire[]>;
  décisionStratégique: Record<Chantier["id"], DécisionStratégique>;
  objectifs: Record<Chantier["id"], Objectif[]>;
  synthèsesDesRésultats: Record<Chantier["id"], SynthèseDesRésultats>;
};
