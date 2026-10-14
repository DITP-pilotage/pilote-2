import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SyntheseDesResultatsV2 } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { Meteo } from "@/shared/meteo/Meteo.interface";

type ParamsCreation = {
  chantierId: string;
  territoireCode: string;
  contenu: string;
  auteurId: string;
  date: string;
};

type ParamsModification = {
  contenu: string;
  auteurModificationId: string;
  dateModification: string;
};

type MeteoObligatoire = { meteo: Meteo };

type MeteoFacultative = { meteo?: Meteo };

export function creerSyntheseDesResultatsPublie(
  params: ParamsCreation & MeteoObligatoire,
): SyntheseDesResultatsV2 {
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
  params: ParamsCreation & MeteoFacultative,
): SyntheseDesResultatsV2 {
  return {
    id: randomUUID(),
    chantierId: params.chantierId,
    territoireCode: params.territoireCode,
    contenu: params.contenu,
    meteo: params.meteo ?? "NON_RENSEIGNEE",
    auteurCreationId: params.auteurId,
    dateCreation: params.date,
    auteurModificationId: params.auteurId,
    dateModification: params.date,
    statut: $Enums.statut_publication.BROUILLON,
  };
}

export function publierBrouillonSyntheseDesResultats(
  existing: SyntheseDesResultatsV2,
  params: ParamsModification & MeteoObligatoire,
): SyntheseDesResultatsV2 {
  if (existing.statut !== $Enums.statut_publication.BROUILLON)
    throw new Error(
      `Statut invalide : attendu BROUILLON, reçu ${existing.statut}`,
    );

  return {
    ...existing,
    contenu: params.contenu,
    meteo: params.meteo,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function modifierSyntheseDesResultatsPubliee(
  existing: SyntheseDesResultatsV2,
  params: ParamsModification & MeteoObligatoire,
): SyntheseDesResultatsV2 {
  if (existing.statut !== $Enums.statut_publication.PUBLIE)
    throw new Error(
      `Statut invalide : attendu PUBLIE, reçu ${existing.statut}`,
    );

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
  existing: SyntheseDesResultatsV2,
  params: ParamsModification & MeteoFacultative,
): SyntheseDesResultatsV2 {
  if (existing.statut !== $Enums.statut_publication.BROUILLON)
    throw new Error(
      `Statut invalide : attendu BROUILLON, reçu ${existing.statut}`,
    );

  return {
    ...existing,
    contenu: params.contenu,
    meteo: params.meteo ?? "NON_RENSEIGNEE",
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.BROUILLON,
  };
}
