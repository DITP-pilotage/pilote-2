import type { $Enums } from "@prisma/client";
import {
  LIBELLES_MOTIF,
  MOTIFS_ORDER,
  type LibelleMaille,
  type LibelleMotif,
  type LigneFusionnee,
  type Motif,
} from "@/server/albert/tools/indicateursACompleter";
import { libelleMaille } from "@/server/albert/tools/libelles";

export type NombresParMaille = Partial<Record<LibelleMaille, number>>;
export type IndicateurResume = {
  chantier: string;
  indicateur: string;
} & Partial<Record<LibelleMotif, NombresParMaille>>;
export type ResumeIndicateursACompleter = {
  perimetre: string;
  jalon_vc?: number;
  indicateurs: IndicateurResume[];
  sans_valeur_a_completer?: string[];
};

const comparer = (gauche: string, droite: string) =>
  gauche < droite ? -1 : gauche > droite ? 1 : 0;

const nombresParMaille = (
  lignes: LigneFusionnee[],
  mailles: $Enums.Maille[],
): NombresParMaille =>
  Object.fromEntries(
    mailles.map((maille) => [
      libelleMaille({ maille }),
      new Set(
        lignes
          .filter((ligne) => ligne.maille === maille)
          .map((ligne) => ligne.territoireCode),
      ).size,
    ]),
  );

export function resumerIndicateursACompleter({
  lignes,
  motifs,
  mailles,
  perimetre,
  jalon,
  demandesExplicites,
}: {
  lignes: LigneFusionnee[];
  motifs: Motif[];
  mailles: $Enums.Maille[];
  perimetre: string;
  jalon?: number;
  demandesExplicites: string[];
}): ResumeIndicateursACompleter {
  const lignesParIndicateur = new Map<string, LigneFusionnee[]>();
  for (const ligne of lignes) {
    const cle = `${ligne.chantierId}\u0000${ligne.indicateurId}`;
    lignesParIndicateur.set(cle, [
      ...(lignesParIndicateur.get(cle) ?? []),
      ligne,
    ]);
  }

  const indicateurs: IndicateurResume[] = [...lignesParIndicateur.entries()]
    .sort(([gauche], [droite]) => comparer(gauche, droite))
    .map(([, lignesIndicateur]) => {
      const premiereLigne = lignesIndicateur[0]!;
      const motifsConcernes = MOTIFS_ORDER.filter(
        (motif) =>
          motifs.includes(motif) &&
          lignesIndicateur.some((ligne) => ligne.motifs.has(motif)),
      );
      return {
        chantier: `${premiereLigne.chantierId} · ${premiereLigne.chantierNom}`,
        indicateur: `${premiereLigne.indicateurId} · ${premiereLigne.indicateurNom}`,
        ...Object.fromEntries(
          motifsConcernes.map((motif) => [
            LIBELLES_MOTIF[motif],
            nombresParMaille(
              lignesIndicateur.filter((ligne) => ligne.motifs.has(motif)),
              mailles,
            ),
          ]),
        ),
      };
    });

  const sansValeur = demandesExplicites.filter(
    (identifiant) =>
      !lignes.some(
        (ligne) =>
          ligne.chantierId === identifiant ||
          ligne.indicateurId === identifiant,
      ),
  );

  return {
    perimetre,
    ...(motifs.includes("vc") && jalon !== undefined && { jalon_vc: jalon }),
    indicateurs,
    ...(sansValeur.length > 0 && { sans_valeur_a_completer: sansValeur }),
  };
}
