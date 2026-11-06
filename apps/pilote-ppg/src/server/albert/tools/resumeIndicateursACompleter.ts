import type { $Enums } from "@prisma/client";
import {
  comparer,
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
  indicateur: string;
} & Partial<Record<LibelleMotif, NombresParMaille>>;
export type ChantierResume = {
  chantier: string;
  indicateurs: IndicateurResume[];
};
export type ResumeIndicateursACompleter = {
  perimetre: string;
  jalon_vc?: number;
  chantiers: ChantierResume[];
  sans_valeur_a_completer?: string[];
};

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
  const lignesParChantier = Map.groupBy(lignes, (ligne) => ligne.chantierId);

  const chantiers: ChantierResume[] = [...lignesParChantier.entries()]
    .sort(([gauche], [droite]) => comparer(gauche, droite))
    .map(([, lignesChantier]) => {
      const lignesParIndicateur = Map.groupBy(
        lignesChantier,
        (ligne) => ligne.indicateurId,
      );
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
      const premiereLigne = lignesChantier[0]!;
      return {
        chantier: `${premiereLigne.chantierId} · ${premiereLigne.chantierNom}`,
        indicateurs,
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
    chantiers,
    ...(sansValeur.length > 0 && { sans_valeur_a_completer: sansValeur }),
  };
}
