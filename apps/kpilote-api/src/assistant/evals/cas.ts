import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'

export type CasEval = {
  nom: string
  question: string
  surface: Surface
  attendu: {
    /** Outils qui DOIVENT avoir été appelés, dans n'importe quel ordre. */
    outilsAppeles?: ReadonlyArray<NomOutil>
    /** Outils qui ne doivent PAS l'avoir été. */
    outilsInterdits?: ReadonlyArray<NomOutil>
    /** Identifiants publics qui doivent figurer dans les sources émises. */
    sourcesContiennent?: ReadonlyArray<string>
    /** Aucune source ne doit être émise — sert à vérifier l'absence de fuite. */
    aucuneSource?: boolean
    /** Le tour ne doit avoir déclenché aucun appel d'outil. */
    aucunOutil?: boolean
    /** Types de vignette qui doivent figurer dans la vue composée. */
    vignettesContiennent?: ReadonlyArray<string>
    /** Nombre minimal de territoires distincts portés par les vignettes. */
    territoiresDistincts?: number
  }
}

// On n'évalue pas la prose : elle est instable et la noter demanderait un juge, donc du
// bruit. « Quel outil », « avec quels paramètres », « quelles sources » sont des faits
// binaires, extraits du transcript qu'on stocke déjà.
//
// Les identifiants supposent le jeu de données de recette : les ajuster à l'environnement
// d'exécution avant le premier passage.
export const CAS: ReadonlyArray<CasEval> = [
  {
    nom: 'résolution depuis un libellé approximatif',
    question: "l'indicateur sur la fraude fiscale, il en est où ?",
    surface: 'ask-libre',
    attendu: { outilsAppeles: ['search_indicateurs', 'get_synthese_indicateur'] },
  },
  {
    nom: 'résolution depuis un acronyme — le pré-filtre échoue, le repli doit prendre le relais',
    question: 'les indicateurs sur les VSS',
    surface: 'ask-libre',
    attendu: { outilsAppeles: ['search_indicateurs'] },
  },
  {
    nom: 'identifiant explicite, pas de recherche',
    question: 'donne-moi la synthèse de IND-1',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['get_synthese_indicateur'],
      outilsInterdits: ['search_indicateurs'],
      sourcesContiennent: ['IND-1'],
    },
  },
  {
    nom: 'préfère la synthèse composée aux appels unitaires',
    question: 'où en est IND-1 ?',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['get_synthese_indicateur'],
      outilsInterdits: ['get_indicateur_valeurs'],
    },
  },
  {
    nom: 'hors périmètre',
    question: 'quelle est la capitale du Portugal ?',
    surface: 'ask-libre',
    attendu: { aucunOutil: true },
  },
  {
    nom: 'entité inaccessible : aucune fuite en sources',
    question: 'donne-moi la synthèse de IND-999',
    surface: 'ask-libre',
    attendu: { aucuneSource: true },
  },
  {
    nom: 'question ambiguë : demande de précision',
    question: 'et les chiffres ?',
    surface: 'ask-libre',
    attendu: { aucunOutil: true },
  },
  {
    nom: 'composition avec entité et territoire fournis',
    question: 'montre-moi IND-1 sur DEPT-84',
    surface: 'ask-libre',
    attendu: {
      outilsAppeles: ['compose_vue'],
      vignettesContiennent: ['vignette_avancement_indicateur'],
    },
  },
  {
    nom: 'comparaison : une vignette par territoire',
    question: 'compare IND-1 entre DEPT-84 et DEPT-13',
    surface: 'ask-libre',
    attendu: { outilsAppeles: ['compose_vue'], territoiresDistincts: 2 },
  },
  {
    // Le cas le plus important : composer sur un territoire choisi au hasard serait pire
    // que ne rien afficher.
    nom: 'sans territoire, l’assistant demande au lieu de composer',
    question: 'montre-moi la fraude fiscale',
    surface: 'ask-libre',
    attendu: { outilsInterdits: ['compose_vue'] },
  },
]
