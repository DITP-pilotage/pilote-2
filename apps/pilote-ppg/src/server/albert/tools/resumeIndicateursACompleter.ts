import type { $Enums } from "@prisma/client";
import {
  LIBELLES_MOTIF,
  MOTIFS_ORDER,
  type LibelleMotif,
  type LigneFusionnee,
  type Motif,
} from "@/server/albert/tools/indicateursACompleter";

export const SEUIL_INDICATEURS_RESUME = 20;

const CLE_TOUS_MOTIFS = "tous motifs confondus";

export type CleResume = LibelleMotif | typeof CLE_TOUS_MOTIFS;
export type PhrasesParMotif = Partial<Record<CleResume, string>>;
export type IndicateurResume = { indicateur: string } & PhrasesParMotif;
export type ChantierResume = {
  chantier: string;
  indicateurs?: IndicateurResume[];
} & PhrasesParMotif;
export type ResumeIndicateursACompleter = {
  en_bref: string;
  jalon_vc?: number;
  ensemble: PhrasesParMotif;
  chantiers: ChantierResume[];
  sans_valeur_a_completer?: string[];
};

const comparer = (gauche: string, droite: string) =>
  gauche < droite ? -1 : gauche > droite ? 1 : 0;

const pluriel = (
  nombre: number,
  singulier: string,
  pluriel: string,
  aucun: string,
) =>
  nombre === 0
    ? aucun
    : nombre === 1
      ? `1 ${singulier}`
      : `${nombre} ${pluriel}`;

const PHRASES_MAILLE: Record<$Enums.Maille, (nombre: number) => string> = {
  NAT: (nombre) =>
    pluriel(
      nombre,
      "territoire national",
      "territoires nationaux",
      "aucun territoire national",
    ),
  REG: (nombre) => pluriel(nombre, "région", "régions", "aucune région"),
  DEPT: (nombre) =>
    pluriel(nombre, "département", "départements", "aucun département"),
};

const phraseChantiers = (nombre: number) =>
  pluriel(nombre, "chantier", "chantiers", "aucun chantier");
const phraseIndicateurs = (nombre: number) =>
  pluriel(nombre, "indicateur", "indicateurs", "aucun indicateur");

const phraseMailles = (
  lignes: LigneFusionnee[],
  mailles: $Enums.Maille[],
): string =>
  mailles
    .map((maille) => {
      const territoires = new Set(
        lignes
          .filter((ligne) => ligne.maille === maille)
          .map((ligne) => ligne.territoireCode),
      );
      return PHRASES_MAILLE[maille](territoires.size);
    })
    .join(", ");

const compterDistincts = (
  lignes: LigneFusionnee[],
  cle: "chantierId" | "indicateurId",
) => new Set(lignes.map((ligne) => ligne[cle])).size;

const grouper = (
  lignes: LigneFusionnee[],
  cle: "chantierId" | "indicateurId",
): LigneFusionnee[][] => {
  const groupes = new Map<string, LigneFusionnee[]>();
  for (const ligne of lignes) {
    groupes.set(ligne[cle], [...(groupes.get(ligne[cle]) ?? []), ligne]);
  }
  return [...groupes.entries()]
    .sort(([gauche], [droite]) => comparer(gauche, droite))
    .map(([, groupe]) => groupe);
};

const clesDesMotifs = (motifs: Motif[]): CleResume[] => [
  ...motifs.map((motif) => LIBELLES_MOTIF[motif]),
  ...(motifs.length >= 2 ? [CLE_TOUS_MOTIFS as CleResume] : []),
];

const lignesDeLaCle = (lignes: LigneFusionnee[], cle: CleResume) =>
  cle === CLE_TOUS_MOTIFS
    ? lignes
    : lignes.filter((ligne) =>
        MOTIFS_ORDER.some(
          (motif) => LIBELLES_MOTIF[motif] === cle && ligne.motifs.has(motif),
        ),
      );

export function resumerIndicateursACompleter({
  lignes,
  motifs,
  mailles,
  unSeulTerritoire,
  perimetre,
  jalon,
  demandesExplicites,
}: {
  lignes: LigneFusionnee[];
  motifs: Motif[];
  mailles: $Enums.Maille[];
  unSeulTerritoire: boolean;
  perimetre: string;
  jalon?: number;
  demandesExplicites: string[];
}): ResumeIndicateursACompleter {
  const cles = clesDesMotifs(motifs);

  const suffixeMailles = (lignesConcernees: LigneFusionnee[]) =>
    unSeulTerritoire ? "" : ` · ${phraseMailles(lignesConcernees, mailles)}`;

  const phraseEnsemble = (lignesConcernees: LigneFusionnee[]) =>
    `${phraseChantiers(compterDistincts(lignesConcernees, "chantierId"))}, ${phraseIndicateurs(compterDistincts(lignesConcernees, "indicateurId"))}${suffixeMailles(lignesConcernees)}`;

  const phraseChantier = (lignesConcernees: LigneFusionnee[]) =>
    `${phraseIndicateurs(compterDistincts(lignesConcernees, "indicateurId"))}${suffixeMailles(lignesConcernees)}`;

  const phraseIndicateur = (lignesConcernees: LigneFusionnee[]) =>
    unSeulTerritoire ? "à compléter" : phraseMailles(lignesConcernees, mailles);

  const phrasesDe = (
    lignesDuNiveau: LigneFusionnee[],
    phraser: (lignesConcernees: LigneFusionnee[]) => string,
    options: { inclureSansLigne: boolean; inclureTousMotifs: boolean },
  ): PhrasesParMotif => {
    const phrases: PhrasesParMotif = {};
    for (const cle of cles) {
      if (cle === CLE_TOUS_MOTIFS && !options.inclureTousMotifs) continue;
      const lignesConcernees = lignesDeLaCle(lignesDuNiveau, cle);
      if (lignesConcernees.length > 0) phrases[cle] = phraser(lignesConcernees);
      else if (options.inclureSansLigne) phrases[cle] = "aucun indicateur";
    }
    return phrases;
  };

  const avecIndicateurs =
    compterDistincts(lignes, "indicateurId") <= SEUIL_INDICATEURS_RESUME;

  const chantiers: ChantierResume[] = grouper(lignes, "chantierId")
    .sort(
      (gauche, droite) =>
        compterDistincts(droite, "indicateurId") -
          compterDistincts(gauche, "indicateurId") ||
        comparer(gauche[0]!.chantierId, droite[0]!.chantierId),
    )
    .map((lignesChantier) => ({
      chantier: `${lignesChantier[0]!.chantierId} · ${lignesChantier[0]!.chantierNom}`,
      ...phrasesDe(lignesChantier, phraseChantier, {
        inclureSansLigne: false,
        inclureTousMotifs: true,
      }),
      ...(avecIndicateurs && {
        indicateurs: grouper(lignesChantier, "indicateurId").map(
          (lignesIndicateur) => ({
            indicateur: `${lignesIndicateur[0]!.indicateurId} · ${lignesIndicateur[0]!.indicateurNom}`,
            ...phrasesDe(lignesIndicateur, phraseIndicateur, {
              inclureSansLigne: false,
              inclureTousMotifs: false,
            }),
          }),
        ),
      }),
    }));

  const libellesMotifs = motifs
    .map((motif) =>
      motif === "vc"
        ? `VC manquante pour le jalon ${jalon}`
        : LIBELLES_MOTIF[motif],
    )
    .join(", ");
  const enBref =
    lignes.length > 0
      ? `Périmètre : ${perimetre}. ${phraseChantiers(compterDistincts(lignes, "chantierId"))} et ${phraseIndicateurs(compterDistincts(lignes, "indicateurId"))} ont des valeurs à compléter (${libellesMotifs}).`
      : `Périmètre : ${perimetre}. Aucune valeur à compléter (${libellesMotifs}).`;

  const sansValeur = demandesExplicites.filter(
    (identifiant) =>
      !lignes.some(
        (ligne) =>
          ligne.chantierId === identifiant ||
          ligne.indicateurId === identifiant,
      ),
  );

  return {
    en_bref: enBref,
    ...(motifs.includes("vc") && jalon !== undefined && { jalon_vc: jalon }),
    ensemble: phrasesDe(lignes, phraseEnsemble, {
      inclureSansLigne: true,
      inclureTousMotifs: true,
    }),
    chantiers,
    ...(sansValeur.length > 0 && { sans_valeur_a_completer: sansValeur }),
  };
}
