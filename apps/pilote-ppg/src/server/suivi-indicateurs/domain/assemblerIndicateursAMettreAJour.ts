import { $Enums } from "@prisma/client";
import type {
  IndicateurAParametrer,
  IndicateurNonAJour,
  IndicateursAMettreAJour,
  ManqueParametrage,
} from "./IndicateursAMettreAJour";

export interface IdentiteIndicateur {
  indicateurId: string;
  nom: string;
  chantierId: string;
  chantierNom: string;
  periodicite: string | null;
  delaiDisponibilite: number | null;
  responsablesDonneesMails: string[];
}

export interface CompteApplicable {
  indicateurId: string;
  nbTerritoires: number;
}

export interface GroupeEnRetard {
  indicateurId: string;
  maille: $Enums.Maille;
  nbTerritoires: number;
  minProchaineDateMajJours: number | null;
  minDateDerniereValeur: Date | null;
  minDateMajAttendue: Date | null;
}

export interface LigneAParametrer {
  indicateurId: string;
  valeurInitialeManquante: boolean;
  valeurCibleManquante: boolean;
}

const ORDRE_MAILLES: $Enums.Maille[] = [
  $Enums.Maille.NAT,
  $Enums.Maille.REG,
  $Enums.Maille.DEPT,
];

const minimum = <T extends number | Date>(
  gauche: T | null,
  droite: T | null,
): T | null => {
  if (gauche === null) return droite;
  if (droite === null) return gauche;
  return gauche <= droite ? gauche : droite;
};

const comparerParChantierPuisNom = (
  gauche: { chantierId: string; nom: string },
  droite: { chantierId: string; nom: string },
) =>
  gauche.chantierId.localeCompare(droite.chantierId) ||
  gauche.nom.localeCompare(droite.nom);

export function assemblerIndicateursAMettreAJour(entree: {
  identites: IdentiteIndicateur[];
  applicables: CompteApplicable[];
  enRetard: GroupeEnRetard[];
  aParametrer: LigneAParametrer[];
}): IndicateursAMettreAJour {
  const identiteParId = new Map(
    entree.identites.map((identite) => [identite.indicateurId, identite]),
  );
  const applicablesParId = new Map(
    entree.applicables.map((compte) => [
      compte.indicateurId,
      compte.nbTerritoires,
    ]),
  );

  const fusionEnRetard = new Map<
    string,
    Omit<GroupeEnRetard, "maille" | "indicateurId"> & {
      mailles: Set<$Enums.Maille>;
    }
  >();
  for (const groupe of entree.enRetard) {
    const existant = fusionEnRetard.get(groupe.indicateurId);
    if (!existant) {
      fusionEnRetard.set(groupe.indicateurId, {
        nbTerritoires: groupe.nbTerritoires,
        minProchaineDateMajJours: groupe.minProchaineDateMajJours,
        minDateDerniereValeur: groupe.minDateDerniereValeur,
        minDateMajAttendue: groupe.minDateMajAttendue,
        mailles: new Set([groupe.maille]),
      });
      continue;
    }
    existant.nbTerritoires += groupe.nbTerritoires;
    existant.minProchaineDateMajJours = minimum(
      existant.minProchaineDateMajJours,
      groupe.minProchaineDateMajJours,
    );
    existant.minDateDerniereValeur = minimum(
      existant.minDateDerniereValeur,
      groupe.minDateDerniereValeur,
    );
    existant.minDateMajAttendue = minimum(
      existant.minDateMajAttendue,
      groupe.minDateMajAttendue,
    );
    existant.mailles.add(groupe.maille);
  }

  const nonAJour: IndicateurNonAJour[] = [];
  for (const [indicateurId, fusion] of fusionEnRetard) {
    const identite = identiteParId.get(indicateurId);
    if (!identite) continue;
    nonAJour.push({
      chantierId: identite.chantierId,
      chantierNom: identite.chantierNom,
      indicateurId,
      nom: identite.nom,
      periodicite: identite.periodicite,
      delaiDisponibilite: identite.delaiDisponibilite,
      mailles: ORDRE_MAILLES.filter((maille) => fusion.mailles.has(maille)),
      nbTerritoiresEnRetard: fusion.nbTerritoires,
      nbTerritoiresApplicables:
        applicablesParId.get(indicateurId) ?? fusion.nbTerritoires,
      retardMaxJours:
        fusion.minProchaineDateMajJours === null
          ? null
          : -fusion.minProchaineDateMajJours,
      dateDerniereValeurPlusAncienne:
        fusion.minDateDerniereValeur?.toISOString() ?? null,
      dateMajAttenduePlusAncienne:
        fusion.minDateMajAttendue?.toISOString() ?? null,
      responsablesDonneesMails: identite.responsablesDonneesMails,
    });
  }

  const fusionAParametrer = new Map<
    string,
    { manques: Set<ManqueParametrage>; nbTerritoires: number }
  >();
  for (const ligne of entree.aParametrer) {
    const existant = fusionAParametrer.get(ligne.indicateurId) ?? {
      manques: new Set<ManqueParametrage>(),
      nbTerritoires: 0,
    };
    if (ligne.valeurInitialeManquante) existant.manques.add("VALEUR_INITIALE");
    if (ligne.valeurCibleManquante) existant.manques.add("VALEUR_CIBLE");
    existant.nbTerritoires += 1;
    fusionAParametrer.set(ligne.indicateurId, existant);
  }

  const ordreManques: ManqueParametrage[] = ["VALEUR_INITIALE", "VALEUR_CIBLE"];
  const aParametrer: IndicateurAParametrer[] = [];
  for (const [indicateurId, fusion] of fusionAParametrer) {
    const identite = identiteParId.get(indicateurId);
    if (!identite) continue;
    aParametrer.push({
      chantierId: identite.chantierId,
      chantierNom: identite.chantierNom,
      indicateurId,
      nom: identite.nom,
      periodicite: identite.periodicite,
      manques: ordreManques.filter((manque) => fusion.manques.has(manque)),
      nbTerritoires: fusion.nbTerritoires,
      nbTerritoiresApplicables:
        applicablesParId.get(indicateurId) ?? fusion.nbTerritoires,
    });
  }

  return {
    nonAJour: nonAJour.sort(comparerParChantierPuisNom),
    aParametrer: aParametrer.sort(comparerParChantierPuisNom),
  };
}
