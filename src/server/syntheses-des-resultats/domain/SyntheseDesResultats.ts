import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";

type ParamsCreation = {
  chantierId: string;
  territoireCode: string;
  contenu: string;
  meteo: Météo;
  auteurId: string;
  date: string;
};

type ParamsModification = {
  contenu: string;
  meteo: Météo;
  auteurModificationId: string;
  dateModification: string;
};

export function creerSyntheseDesResultatsPublie(
  params: ParamsCreation,
): SynthèseDesRésultatsV2 {
  return {
    id: randomUUID(),
    chantierId: params.chantierId,
    territoireCode: params.territoireCode,
    contenu: params.contenu,
    meteo: params.meteo,
    auteurCreationId: params.auteurId,
    dateCreation: params.date,
    auteurModificationId: params.auteurId,
    dateModification: params.date,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function creerSyntheseDesResultatsBrouillon(
  params: ParamsCreation,
): SynthèseDesRésultatsV2 {
  return {
    id: randomUUID(),
    chantierId: params.chantierId,
    territoireCode: params.territoireCode,
    contenu: params.contenu,
    meteo: params.meteo,
    auteurCreationId: params.auteurId,
    dateCreation: params.date,
    auteurModificationId: params.auteurId,
    dateModification: params.date,
    statut: $Enums.statut_publication.BROUILLON,
  };
}

export function modifierSyntheseDesResultats(
  existing: SynthèseDesRésultatsV2,
  params: ParamsModification,
): SynthèseDesRésultatsV2 {
  return {
    ...existing,
    contenu: params.contenu,
    meteo: params.meteo,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function modifierSyntheseDesResultatsBrouillon(
  existing: SynthèseDesRésultatsV2,
  params: ParamsModification,
): SynthèseDesRésultatsV2 {
  return {
    ...existing,
    contenu: params.contenu,
    meteo: params.meteo,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.BROUILLON,
  };
}
