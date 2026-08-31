import '@hono/zod-openapi'

import { extraireReferences } from '@pilote/kpilote-shared/assistant/sources'
import { MODELES, type Modele } from '@pilote/kpilote-shared/assistant/surfaces'
import { generateText, stepCountIs } from 'ai'

import { CAS, type CasEval } from '@/assistant/evals/cas'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { creerModeleAssistant, MAX_ETAPES, MODELE_PAR_DEFAUT } from '@/assistant/runtime/modele'
import { resoudreOutils } from '@/assistant/tools/registry'
import { creerRequeteur } from '@/assistant/tools/requeteur'

const JETON = process.env.EVAL_API_KEY
if (!JETON) throw new Error('EVAL_API_KEY manquante — clé API utilisée pour les appels d’outils.')

const MODELE = (process.env.EVAL_MODELE as Modele | undefined) ?? MODELE_PAR_DEFAUT
if (!(MODELES as ReadonlyArray<string>).includes(MODELE)) {
  throw new Error(`EVAL_MODELE inconnu : ${MODELE}. Attendu : ${MODELES.join(', ')}`)
}

type Verdict = { cas: string; ok: boolean; details: string[] }

const evaluer = async (cas: CasEval): Promise<Verdict> => {
  const { app } = await import('../../app')

  const resultat = await generateText({
    model: creerModeleAssistant(MODELE),
    system: construireSystemPrompt({ surface: cas.surface, maintenant: new Date() }),
    prompt: cas.question,
    tools: resoudreOutils(cas.surface, creerRequeteur(app, JETON)),
    stopWhen: stepCountIs(MAX_ETAPES),
  })

  const appeles = resultat.steps.flatMap((etape) => etape.toolCalls.map((appel) => appel.toolName))
  // `output` est `any` cote SDK : on coupe sa propagation avant l'extraction.
  const sorties: unknown[] = resultat.steps.flatMap((etape) =>
    etape.toolResults.map((appel): unknown => appel.output),
  )
  const sources = extraireReferences(sorties).map((reference) => reference.publicId)

  const details: string[] = []
  const { attendu } = cas

  for (const requis of attendu.outilsAppeles ?? []) {
    if (!appeles.includes(requis)) details.push(`outil manquant : ${requis}`)
  }
  for (const interdit of attendu.outilsInterdits ?? []) {
    if (appeles.includes(interdit)) details.push(`outil interdit appelé : ${interdit}`)
  }
  for (const source of attendu.sourcesContiennent ?? []) {
    if (!sources.includes(source)) details.push(`source manquante : ${source}`)
  }
  if (attendu.aucuneSource && sources.length > 0) {
    details.push(`aucune source attendue, ${sources.length} émise(s) : ${sources.join(', ')}`)
  }
  if (attendu.aucunOutil && appeles.length > 0) {
    details.push(`aucun outil attendu, ${appeles.length} appelé(s) : ${appeles.join(', ')}`)
  }

  const vignettes = sorties
    .filter((sortie): sortie is { vignettes: Array<Record<string, unknown>> } => {
      const candidat = sortie as { vignettes?: unknown }
      return Array.isArray(candidat.vignettes)
    })
    .flatMap((vue) => vue.vignettes)

  for (const attendue of attendu.vignettesContiennent ?? []) {
    if (!vignettes.some((vignette) => vignette.type === attendue)) {
      details.push(`vignette manquante : ${attendue}`)
    }
  }
  if (attendu.territoiresDistincts !== undefined) {
    const territoires = new Set(
      vignettes
        .map((vignette) => vignette.individuId)
        .filter((valeur): valeur is string => typeof valeur === 'string'),
    )
    if (territoires.size < attendu.territoiresDistincts) {
      details.push(
        `${attendu.territoiresDistincts} territoires attendus, ${territoires.size} trouvé(s)`,
      )
    }
  }

  return { cas: cas.nom, ok: details.length === 0, details }
}

const principal = async (): Promise<void> => {
  console.log(`Modèle évalué : ${MODELE}\n`)

  const verdicts: Verdict[] = []
  for (const cas of CAS) verdicts.push(await evaluer(cas))

  for (const verdict of verdicts) {
    console.log(`${verdict.ok ? 'OK   ' : 'ÉCHEC'} ${verdict.cas}`)
    for (const detail of verdict.details) console.log(`      ${detail}`)
  }

  const reussis = verdicts.filter((verdict) => verdict.ok).length
  console.log(`\n${reussis}/${verdicts.length} cas réussis`)

  if (reussis !== verdicts.length) process.exitCode = 1
}

void principal()
