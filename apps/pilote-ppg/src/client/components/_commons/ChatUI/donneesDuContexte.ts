import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierObjectifsOutput } from "@/server/albert/tools/getChantierObjectifs";
import type {
  ChantierRenvoye,
  GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import type { GetChantiersSignalesOutput } from "@/server/albert/tools/getChantiersSignales";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";
import type { EncartOutput } from "@/server/albert/tools/encart";
import { couvertureEncart } from "@/server/albert/tools/couvertureEncart";

export type TableauContexte = { colonnes: string[]; lignes: string[][] };

export type EntreeContexte = {
  id: string;
  titre: string;
  resume: string;
  /** Pour un encart : ce que l'assistant n'a pas, et doit aller chercher. */
  absent?: string;
  tableau?: TableauContexte;
};

export type GroupeContexte = {
  cle: string;
  perimetre: string;
  entrees: EntreeContexte[];
};

export type DonneesDuContexte = {
  groupes: GroupeContexte[];
  nombreEntrees: number;
  /** Résultats d'un format que le panneau ne sait pas lire (anciens messages). */
  illisibles: number;
};

type Territoire = { code: string; nom: string | null };

type Lecture = {
  territoires: Territoire[];
  /** Périmètre écrit tel quel, quand les territoires ne suffisent pas. */
  perimetre?: string;
  jalon?: number;
  entree: Omit<EntreeContexte, "id">;
};

type PartOutil = {
  type: string;
  toolCallId: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  preliminary?: boolean;
};

type LireTerritoire = (code: string) => string | null;

const pluriel = (nombre: number, singulier: string, plurielForme?: string) =>
  `${nombre} ${nombre > 1 ? (plurielForme ?? `${singulier}s`) : singulier}`;

const pourcentage = (valeur: number | null | undefined) =>
  valeur === null || valeur === undefined ? "—" : `${Math.round(valeur)} %`;

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

const valeur = (valeurBrute: number | null) =>
  valeurBrute === null ? "—" : nombre.format(valeurBrute);

const ecart = (valeurBrute: number | null) =>
  valeurBrute === null
    ? "—"
    : `${valeurBrute > 0 ? "+" : ""}${Math.round(valeurBrute)} pts`;

const territoiresDistincts = (territoires: Territoire[]): Territoire[] => {
  const parCode = new Map<string, Territoire>();
  for (const territoire of territoires) {
    if (!parCode.has(territoire.code)) parCode.set(territoire.code, territoire);
  }
  return [...parCode.values()];
};

const LIBELLES_VUE: Record<string, string> = {
  all: "Chantiers",
  en_retard: "Chantiers en retard",
  en_difficulte: "Chantiers en difficulté",
};

const lireTauxAvancement = ({
  output,
}: {
  output: GetTauxAvancementTerritoireOutput;
}): Lecture => ({
  territoires: output.resultats.map((resultat) => ({
    code: resultat.territoire_code,
    nom: resultat.territoire_nom,
  })),
  jalon: output.resultats[0]?.jalon,
  entree: {
    titre: "Taux d'avancement",
    resume: `${pluriel(output.resultats.length, "territoire")}, avec leur position face à la médiane`,
    tableau: {
      colonnes: ["Territoire", "Taux", "Médiane"],
      lignes: output.resultats.map((resultat) => [
        resultat.territoire_nom ?? resultat.territoire_code,
        resultat.taux_avancement_global,
        resultat.mediane_repartition,
      ]),
    },
  },
});

const lireChantiers = ({
  input,
  output,
}: {
  input: { view?: string; chantier_ids?: string[]; jalon?: number };
  output: GetChantiersOutput;
}): Lecture => {
  const lignes = output.resultats.flatMap((resultat) =>
    resultat.chantiers.map((chantier: ChantierRenvoye) => ({
      territoire: resultat.territoire_nom ?? resultat.territoire_code,
      chantier,
    })),
  );
  const chantiersDistincts = new Set(
    lignes.map(({ chantier }) => chantier.chantier.id),
  );
  const plusieursTerritoires = output.resultats.length > 1;
  const titreVue = LIBELLES_VUE[input.view ?? "all"] ?? "Chantiers";

  return {
    territoires: output.resultats.map((resultat) => ({
      code: resultat.territoire_code,
      nom: resultat.territoire_nom,
    })),
    jalon: output.resultats[0]?.jalon ?? input.jalon,
    entree: {
      titre: input.chantier_ids?.length
        ? `${titreVue} · ${input.chantier_ids.join(", ")}`
        : titreVue,
      resume: `${pluriel(chantiersDistincts.size, "chantier")}, avec écart, niveau de confiance et commentaire de synthèse`,
      tableau: {
        colonnes: plusieursTerritoires
          ? ["Chantier", "Territoire", "Écart"]
          : ["Chantier", "Écart", "Confiance"],
        lignes: lignes.map(({ territoire, chantier }) =>
          plusieursTerritoires
            ? [chantier.chantier.id, territoire, ecart(chantier.ecart)]
            : [
                chantier.chantier.id,
                ecart(chantier.ecart),
                chantier.niveau_de_confiance ?? "—",
              ],
        ),
      },
    },
  };
};

const lireIndicateurs = ({
  input,
  output,
  lireTerritoire,
}: {
  input: { chantier_id: string; territoire_code: string; jalon?: number };
  output: GetChantierIndicateursOutput;
  lireTerritoire: LireTerritoire;
}): Lecture => ({
  territoires: [
    {
      code: input.territoire_code,
      nom: lireTerritoire(input.territoire_code),
    },
  ],
  jalon: input.jalon,
  entree: {
    titre: `Indicateurs · ${input.chantier_id}`,
    resume: pluriel(output.resultats.indicateurs.length, "indicateur"),
    tableau: {
      colonnes: ["Indicateur", "Actuelle", "Cible", "TA"],
      lignes: output.resultats.indicateurs.map((indicateur) => [
        indicateur.nom,
        valeur(indicateur.valeur_actuelle),
        valeur(indicateur.valeur_cible),
        pourcentage(indicateur.taux_avancement),
      ]),
    },
  },
});

const lireCommentaires = ({
  input,
  output,
}: {
  input: { chantier_id: string };
  output: GetChantierCommentairesOutput;
}): Lecture => {
  const nombreCommentaires = output.resultats.reduce(
    (total, resultat) => total + resultat.commentaires.length,
    0,
  );
  return {
    territoires: output.resultats.map((resultat) => ({
      code: resultat.territoire_code,
      nom: resultat.territoire_nom,
    })),
    entree: {
      titre: `Commentaires · ${input.chantier_id}`,
      resume: [output.chantier_nom, pluriel(nombreCommentaires, "commentaire")]
        .filter(Boolean)
        .join(" · "),
    },
  };
};

const TYPES_OBJECTIFS: Record<string, string> = {
  notre_ambition: "notre ambition",
  deja_fait: "déjà fait",
  a_faire: "à faire",
};

const lireObjectifs = ({
  output,
}: {
  output: GetChantierObjectifsOutput;
}): Lecture => {
  const publies = Object.entries(output.objectifs)
    .filter(([, objectif]) => objectif !== null)
    .map(([type]) => TYPES_OBJECTIFS[type] ?? type);
  return {
    territoires: [],
    perimetre: "Objectifs nationaux",
    entree: {
      titre: `Objectifs · ${output.chantier_id}`,
      resume: publies.length > 0 ? publies.join(", ") : "aucun objectif publié",
    },
  };
};

const lireChantiersSignales = ({
  input,
  output,
  lireTerritoire,
}: {
  input: { territoire_code: string };
  output: GetChantiersSignalesOutput;
  lireTerritoire: LireTerritoire;
}): Lecture => ({
  territoires: [
    {
      code: input.territoire_code,
      nom: lireTerritoire(input.territoire_code),
    },
  ],
  entree: {
    titre: "Chantiers signalés",
    resume: pluriel(output.resultats.length, "chantier"),
    tableau: {
      colonnes: ["Chantier", "Écart"],
      lignes: output.resultats.map((chantier) => [
        chantier.id,
        ecart(chantier.ecart),
      ]),
    },
  },
});

const lireEncart = ({ output }: { output: EncartOutput }): Lecture | null => {
  if (!output.donnees || output.acces_refuse) return null;
  const couverture = couvertureEncart({
    jalon: output.jalon,
    donnees: output.donnees,
  });
  const enRetard = new Set(
    output.donnees.chantiers_en_retard.resultats.flatMap((resultat) =>
      resultat.chantiers.map((chantier) => chantier.chantier.id),
    ),
  ).size;
  const enDifficulte = new Set(
    output.donnees.chantiers_en_difficulte.resultats.flatMap((resultat) =>
      resultat.chantiers.map((chantier) => chantier.chantier.id),
    ),
  ).size;

  return {
    territoires: couverture.territoires,
    jalon: couverture.jalon,
    entree: {
      titre:
        output.type === "synthese"
          ? "Synthèse territoriale"
          : "Comparaison de territoires",
      resume: [
        "Taux d'avancement",
        `${pluriel(enRetard, "chantier")} en retard`,
        `${enDifficulte} en difficulté`,
        ...(output.donnees.indicateurs ? ["indicateurs"] : []),
      ].join(" · "),
      absent: `Ne contient pas : ${couverture.ne_contient_pas.join(", ")}`,
    },
  };
};

const lireCentreAide = ({
  output,
}: {
  output: ConsulterCentreAideOutput;
}): Lecture => ({
  territoires: [],
  perimetre: "Centre d'aide PILOTE",
  entree: {
    titre: "Centre d'aide",
    resume: output.trouve
      ? output.sources.map((source) => source.titre).join(", ")
      : "aucune page ne répond à la question",
  },
});

type Lecteur = (params: {
  input: never;
  output: never;
  lireTerritoire: LireTerritoire;
}) => Lecture | null;

/** Les outils qui chargent des données ; la recherche, la clarification et
 * le dashboard n'en apportent pas. */
const LECTEURS: Record<string, Lecteur> = {
  "tool-get_taux_avancement_territoire": lireTauxAvancement as Lecteur,
  "tool-get_chantiers": lireChantiers as Lecteur,
  "tool-get_indicateurs": lireIndicateurs as Lecteur,
  "tool-get_chantier_commentaires": lireCommentaires as Lecteur,
  "tool-get_chantier_objectifs": lireObjectifs as Lecteur,
  "tool-get_chantiers_signales": lireChantiersSignales as Lecteur,
  "tool-rediger_synthese_territoire": lireEncart as Lecteur,
  "tool-rediger_comparaison_territoires": lireEncart as Lecteur,
  "tool-consulter_centre_aide": lireCentreAide as Lecteur,
};

const libellePerimetre = ({
  territoires,
  input,
}: {
  territoires: Territoire[];
  input: unknown;
}) => {
  const noms = territoires.map(
    (territoire) => territoire.nom ?? territoire.code,
  );
  const perimetre = (input as { perimetre?: { type?: string } } | undefined)
    ?.perimetre;
  if (perimetre?.type === "REGION_ET_SES_DEPARTEMENTS" && noms.length > 1) {
    return `${noms[0]} et ses ${pluriel(noms.length - 1, "département")}`;
  }
  if (noms.length <= 3) return noms.join(", ");
  return `${noms.slice(0, 2).join(", ")} et ${noms.length - 2} autres`;
};

/**
 * Ce que l'assistant a chargé au fil de la conversation, regroupé par
 * périmètre (territoires et jalon). Tout vient des résultats d'outils déjà
 * présents dans les messages.
 */
export const donneesDuContexte = ({
  messages,
  lireTerritoire,
}: {
  messages: PiloteUIMessage[];
  lireTerritoire: LireTerritoire;
}): DonneesDuContexte => {
  const groupes = new Map<string, GroupeContexte>();
  let illisibles = 0;

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.parts as PartOutil[]) {
      const lecteur = LECTEURS[part.type];
      if (!lecteur) continue;
      if (part.state !== "output-available" || part.preliminary) continue;

      let lecture: Lecture | null;
      try {
        lecture = lecteur({
          input: (part.input ?? {}) as never,
          output: part.output as never,
          lireTerritoire,
        });
      } catch {
        illisibles += 1;
        continue;
      }
      if (!lecture) continue;

      const territoires = territoiresDistincts(lecture.territoires);
      const perimetre =
        lecture.perimetre ??
        libellePerimetre({ territoires, input: part.input });
      const libelle = lecture.jalon
        ? `${perimetre} · Jalon ${lecture.jalon}`
        : perimetre;
      const cle = `${territoires
        .map((territoire) => territoire.code)
        .sort()
        .join(",")}|${lecture.perimetre ?? ""}|${lecture.jalon ?? ""}`;

      const groupe = groupes.get(cle) ?? {
        cle,
        perimetre: libelle,
        entrees: [],
      };
      groupe.entrees.push({ id: part.toolCallId, ...lecture.entree });
      groupes.set(cle, groupe);
    }
  }

  const liste = [...groupes.values()];
  return {
    groupes: liste,
    nombreEntrees: liste.reduce(
      (total, groupe) => total + groupe.entrees.length,
      0,
    ),
    illisibles,
  };
};
