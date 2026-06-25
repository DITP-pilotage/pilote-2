import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { dateSchema } from '@pilote/mb-shared/dates'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400 } from '@/framework/openapi/responses'
import { generateStructuredOutput } from '@/importPoc/helpers/albert'
import { fuzzyMatchIndividu } from '@/importPoc/helpers/fuzzyMatchIndividu'
import { listIndividusForIndicateur } from '@/importPoc/queries/listIndividusForIndicateur'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'

// POC limite : on évite d'envoyer un fichier de 100k lignes au LLM. À ce stade
// on veut juste valider la faisabilité — 500 lignes couvre largement les jeux
// de données « un département × N mois » des testeurs.
const MAX_ROWS = 500

const rowSchema = z
  .record(z.string(), z.unknown())
  .describe("Ligne brute du fichier (clé = en-tête, valeur = cellule).")

const normaliserBodySchema = z.object({
  rows: z
    .array(rowSchema)
    .min(1)
    .max(MAX_ROWS)
    .describe(`Lignes brutes parsées côté client (1..${MAX_ROWS}).`),
  nomFichier: z
    .string()
    .max(255)
    .optional()
    .describe("Nom du fichier source. Donné en contexte au LLM."),
})

const llmItemSchema = z.object({
  individuLibelle: z
    .string()
    .describe("Libellé textuel de l'individu tel qu'apparu dans la ligne."),
  individuPublicIdPropose: z
    .string()
    .optional()
    .describe("Public ID si reconnaissable dans la liste fournie."),
  date: z.string().describe('Date au format ISO YYYY-MM-DD.'),
  valeur: z.number().describe('Valeur numérique extraite.'),
  ligneSource: z
    .number()
    .int()
    .nonnegative()
    .describe("Index 0-based de la ligne dans `rows`."),
})

const llmOutputSchema = z.object({
  items: z.array(llmItemSchema),
})

const itemNormaliseSchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z.number(),
})

const warningSchema = z.object({
  code: z.enum([
    'INDIVIDU_NON_RECONNU',
    'CONFIANCE_BASSE',
    'DATE_INVALIDE',
    'VALEUR_INVALIDE',
  ]),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  publicIdRetenu: z.string().optional(),
  score: z.number().optional(),
})

const rapportSchema = z.object({
  totalLignes: z.number().int().nonnegative(),
  totalItemsExtraits: z.number().int().nonnegative(),
  totalItemsRetenus: z.number().int().nonnegative(),
  totalItemsBasseConfiance: z.number().int().nonnegative(),
  totalItemsIgnores: z.number().int().nonnegative(),
})

const normaliserResponseSchema = z.object({
  items: z.array(itemNormaliseSchema),
  warnings: z.array(warningSchema),
  rapport: rapportSchema,
})

const NormaliserBodySchema = normaliserBodySchema.openapi('NormaliserPocBody')
const NormaliserResponseSchema = normaliserResponseSchema.openapi('NormaliserPocResponse')

const normaliserRoute = createRoute({
  method: 'post',
  path: '/import-poc/indicateurs/{id}/normaliser',
  tags: ['ImportPoc'],
  summary: "POC — Normaliser un échantillon de lignes brutes vers le format batch d'un indicateur",
  description:
    "POC d'import intelligent. Reçoit des lignes brutes (CSV/Excel parsé côté client) sans " +
    "structure prédéfinie et utilise Albert (LLM) pour les normaliser vers le format " +
    "`PUT /indicateurs/{id}/valeurs:batch`. Le mapping individu est sécurisé par fuzzy match " +
    "post-LLM sur le référentiel de l'indicateur : tout libellé non reconnu remonte en warning. " +
    "À ce stade le POC n'écrit rien en base — il restitue le payload prêt à coller dans le batch.",
  middleware: [requireAuthentication],
  request: {
    params: z.object({ id: indicateurPublicIdSchema }),
    body: {
      content: { 'application/json': { schema: NormaliserBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: NormaliserResponseSchema } },
      description: 'Lignes normalisées + warnings + rapport.',
    },
    400: erreur400,
    503: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Albert non configuré ou injoignable.',
    },
  },
})

// Le LLM voit 50 candidats max pour rester sous une limite de tokens raisonnable
// pour le POC. Si le référentiel dépasse ce seuil, on tronque (le fuzzy match
// post-LLM continue de matcher contre la totalité).
const MAX_CANDIDATS_DANS_PROMPT = 50

const buildPrompt = ({
  indicateurNom,
  uniteLibelle,
  nomFichier,
  candidats,
  rows,
}: {
  indicateurNom: string
  uniteLibelle: string | null
  nomFichier: string | undefined
  candidats: ReadonlyArray<{ publicId: string; nom: string }>
  rows: ReadonlyArray<Record<string, unknown>>
}): { systemPrompt: string; prompt: string } => {
  const candidatsTronques = candidats.slice(0, MAX_CANDIDATS_DANS_PROMPT)
  const candidatsTexte = candidatsTronques
    .map((candidat) => `- ${candidat.publicId} : ${candidat.nom}`)
    .join('\n')
  const reste =
    candidats.length > candidatsTronques.length
      ? `\n(${candidats.length - candidatsTronques.length} autres individus non listés ici, indique le libellé textuel tel quel et laisse individuPublicIdPropose vide.)`
      : ''

  const systemPrompt = [
    "Tu es un assistant qui normalise des données tabulaires hétérogènes vers un format strict d'import.",
    "Tu reçois les lignes brutes d'un fichier (CSV/Excel) téléversé par un agent territorial.",
    "Ta tâche : extraire les triplets (individu, date, valeur) à partir de ces lignes pour un indicateur donné.",
    "Règles strictes :",
    "- Une ligne peut produire 0, 1 ou plusieurs items (ex. colonnes mensuelles → un item par mois).",
    "- Les dates doivent être au format ISO YYYY-MM-DD. Convertis tout autre format (DD/MM/YYYY, mois en français, etc.).",
    "- La valeur est un nombre (point décimal). Convertis les virgules ; ignore les unités collées (« 42,5 % » → 42.5).",
    "- Pour individuPublicIdPropose : ne le renseigne QUE si tu reconnais formellement un identifiant dans la liste fournie. Sinon laisse vide.",
    "- Si tu n'es pas sûr d'une ligne (libellé ambigu, date manquante, valeur non numérique), omets-la.",
    "- ligneSource = index 0-based dans le tableau rows que tu reçois.",
  ].join('\n')

  const prompt = [
    `Indicateur ciblé : « ${indicateurNom} »${uniteLibelle ? ` (unité : ${uniteLibelle})` : ''}.`,
    nomFichier ? `Fichier source : « ${nomFichier} ».` : '',
    '',
    "Individus connus pour cet indicateur (publicId : nom) :",
    candidatsTexte || '(aucun)',
    reste,
    '',
    `Lignes brutes (${rows.length}) :`,
    JSON.stringify(rows, null, 2),
  ]
    .filter(Boolean)
    .join('\n')

  return { systemPrompt, prompt }
}

export const importPocRoutes = new OpenAPIHono()

importPocRoutes.openapi(normaliserRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  // Charge l'indicateur (vérifie aussi la permission read via getIndicateurByPublicId)
  // et la liste des individus de ses référentiels en parallèle.
  const [indicateurResult, individusResult] = await Promise.all([
    getIndicateurByPublicId(id),
    listIndividusForIndicateur(id),
  ])

  if (indicateurResult.isErr()) {
    return jsonResponseError({
      context,
      error: { code: 'ENTITY_NOT_FOUND', message: 'Indicateur introuvable.' },
      schema: ErrorApiModelSchema,
      status: 400,
    })
  }
  const indicateur = indicateurResult.value
  const individus = individusResult.isOk() ? individusResult.value : []

  const { systemPrompt, prompt } = buildPrompt({
    indicateurNom: indicateur.nom,
    uniteLibelle: indicateur.unite?.libelle ?? null,
    nomFichier: body.nomFichier,
    candidats: individus,
    rows: body.rows,
  })

  const llmResult = await generateStructuredOutput({
    schema: llmOutputSchema,
    systemPrompt,
    prompt,
  })

  if (llmResult.isErr()) {
    const error = llmResult.error
    return jsonResponseError({
      context,
      error: {
        code: error.type,
        message:
          error.type === 'ALBERT_NON_CONFIGURE'
            ? "Albert n'est pas configuré côté API (ALBERT_API_KEY manquante)."
            : 'Albert injoignable ou réponse non conforme.',
      },
      schema: ErrorApiModelSchema,
      status: 503,
    })
  }

  const items: Array<z.infer<typeof itemNormaliseSchema>> = []
  const warnings: Array<z.infer<typeof warningSchema>> = []
  let basseConfiance = 0
  let ignores = 0

  for (const llmItem of llmResult.value.items) {
    const dateParse = dateSchema.safeParse(llmItem.date)
    if (!dateParse.success) {
      warnings.push({
        code: 'DATE_INVALIDE',
        message: `Date « ${llmItem.date} » invalide.`,
        ligneSource: llmItem.ligneSource,
        libelleSource: llmItem.individuLibelle,
      })
      ignores += 1
      continue
    }

    if (!Number.isFinite(llmItem.valeur)) {
      warnings.push({
        code: 'VALEUR_INVALIDE',
        message: `Valeur non numérique pour « ${llmItem.individuLibelle} ».`,
        ligneSource: llmItem.ligneSource,
        libelleSource: llmItem.individuLibelle,
      })
      ignores += 1
      continue
    }

    const match = fuzzyMatchIndividu({
      libelle: llmItem.individuLibelle,
      ...(llmItem.individuPublicIdPropose
        ? { publicIdPropose: llmItem.individuPublicIdPropose }
        : {}),
      candidats: individus,
    })

    if (match.kind === 'unmatched') {
      warnings.push({
        code: 'INDIVIDU_NON_RECONNU',
        message: `Aucun individu du référentiel ne correspond à « ${llmItem.individuLibelle} ».`,
        ligneSource: llmItem.ligneSource,
        libelleSource: llmItem.individuLibelle,
        ...(match.meilleurCandidat
          ? {
              publicIdRetenu: match.meilleurCandidat.publicId,
              score: Number(match.meilleurCandidat.score.toFixed(3)),
            }
          : {}),
      })
      ignores += 1
      continue
    }

    if (match.confiance === 'basse') {
      basseConfiance += 1
      warnings.push({
        code: 'CONFIANCE_BASSE',
        message: `Mapping « ${llmItem.individuLibelle} » → ${match.publicId} à vérifier.`,
        ligneSource: llmItem.ligneSource,
        libelleSource: llmItem.individuLibelle,
        publicIdRetenu: match.publicId,
        score: Number(match.score.toFixed(3)),
      })
    }

    items.push({
      individu: match.publicId,
      date: dateParse.data,
      valeur: llmItem.valeur,
    })
  }

  return jsonResponseOk({
    context,
    data: {
      items,
      warnings,
      rapport: {
        totalLignes: body.rows.length,
        totalItemsExtraits: llmResult.value.items.length,
        totalItemsRetenus: items.length,
        totalItemsBasseConfiance: basseConfiance,
        totalItemsIgnores: ignores,
      },
    },
    schema: NormaliserResponseSchema,
    status: 200,
  })
})
