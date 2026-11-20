import { z } from "zod";

// Format de l'envoi de copilot (PUT /api/open-api/formations). Les règles qui portent
// sur le contenu (liste vide, doublons, motif absent) sont dans
// src/server/formations/domain/envoiFormations.ts.
//
// Chaque contrôle porte son message : en production, la carte d'erreurs globale des
// formulaires (src/validation/utilisateur.ts) rendrait sinon « Le champ est requis »
// pour une durée nulle, ou laisserait les formats en anglais.

const DATE_AVEC_FUSEAU = {
  offset: true,
  error:
    "Date ISO 8601 avec fuseau attendue, par exemple 2026-12-03T09:30:00+01:00.",
} as const;

const identifiantRdvSp = z
  .int({ error: "Un identifiant RDV-SP entier est attendu." })
  .positive("Un identifiant RDV-SP strictement positif est attendu.");

const entierPositifOuNul = (nombreNegatif: string) =>
  z.int({ error: "Un nombre entier est attendu." }).nonnegative(nombreNegatif);

const motifSchema = z.object(
  {
    id: identifiantRdvSp,
    nom: z
      .string({ error: "Le nom du motif doit être un texte." })
      .trim()
      .min(1, "Le nom du motif est vide."),
  },
  { error: "Un motif doit être un objet { id, nom }." },
);

const seanceSchema = z.object(
  {
    id: identifiantRdvSp,
    motif_id: identifiantRdvSp,
    date_debut: z.iso.datetime(DATE_AVEC_FUSEAU),
    duree_minutes: z
      .int({ error: "Une durée entière en minutes est attendue." })
      .positive("La durée doit être strictement positive."),
    // Une séance sans agent, ou un agent sans prénom ni nom, est acceptée : le
    // handler ignore les noms absents ou vides.
    animateurs: z
      .array(
        z
          .string({ error: "Un nom d'animateur doit être un texte." })
          .nullable(),
        { error: "Une liste de noms d'animateurs est attendue." },
      )
      .nullable(),
    cancelled_at: z.iso.datetime(DATE_AVEC_FUSEAU).nullable(),
    nombre_places_max: entierPositifOuNul(
      "Le nombre de places ne peut pas être négatif.",
    ).nullable(),
    nombre_inscrits: entierPositifOuNul(
      "Le nombre d'inscrits ne peut pas être négatif.",
    ),
    url_inscription: z.url({
      protocol: /^https$/,
      error: "Un lien d'inscription en https est attendu.",
    }),
  },
  { error: "Une séance doit être un objet." },
);

export const importFormationsSchema = z.object(
  {
    motifs: z.array(motifSchema, {
      error: "Une liste de motifs est attendue.",
    }),
    seances: z.array(seanceSchema, {
      error: "Une liste de séances est attendue.",
    }),
  },
  { error: "Un objet JSON { motifs, seances } est attendu." },
);

export type ImportFormationsInput = z.infer<typeof importFormationsSchema>;
