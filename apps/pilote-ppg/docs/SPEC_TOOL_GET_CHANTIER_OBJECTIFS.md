# Spec : Tool `get_chantier_objectifs` pour Albert

## Contexte

Le tool `get_chantier_commentaires` retourne actuellement deux catégories de contenu de natures très différentes :

- **Commentaires** : contenus textuels rattachés à un couple `(chantier × territoire)` — spécifiques à une maille géographique
- **Objectifs** : ambitions politiques du chantier (`notre_ambition`, `deja_fait`, `a_faire`) — rattachés au chantier au niveau national, sans dimension territoriale

Ce mélange engendre deux problèmes :

1. **Fuite sémantique** : une requête portant sur un territoire spécifique retourne des objectifs nationaux, comme s'ils étaient propres à ce territoire
2. **Duplication** : une requête portant sur plusieurs territoires (via `include_sous_territoires=true`) retourne les objectifs autant de fois qu'il y a de territoires traités

## Décision

Créer un tool dédié `get_chantier_objectifs` et **supprimer les objectifs de `get_chantier_commentaires`**.

---

## Spécification du tool `get_chantier_objectifs`

### Responsabilité

Récupérer les objectifs publiés d'un chantier : ambition politique, avancées réalisées, et actions restant à mener. Ces objectifs représentent la vision nationale du chantier et ne sont pas territorialisés.

### Schéma d'entrée

```typescript
z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
})
```

Pas de `territoire_code` : les objectifs ne sont pas territorialisés. Le contrôle d'accès s'appuie uniquement sur la liste des chantiers accessibles à l'utilisateur.

### Contrôle d'accès

- Le tool reçoit `chantiersAccessibles: string[]` (liste des IDs chantiers accessibles, issue de `session.habilitations.lecture.chantiers`)
- Si `chantier_id` n'est pas dans `chantiersAccessibles` → erreur `Accès non autorisé au chantier ${chantier_id}`
- Un utilisateur n'ayant accès qu'à une maille régionale ou départementale peut tout de même consulter les objectifs nationaux d'un chantier auquel il a accès

### Données retournées

Structure à 3 champs nommés (pas une liste) :

```typescript
type ObjectifItem = {
  date_publication: string; // ISO 8601
  contenu: string;
};

type GetChantierObjectifsOutput = {
  chantier_id: string;
  objectifs: {
    notre_ambition: ObjectifItem | null;
    deja_fait: ObjectifItem | null;
    a_faire: ObjectifItem | null;
  };
  _output_instructions: string;
};
```

**Rationale format :**
- Il n'existe jamais plus d'un item par type par chantier → la liste n'apporte rien
- Un champ `null` indique explicitement qu'aucun objectif publié n'existe pour ce type
- Le LLM peut raisonner directement sur la présence/absence sans parcourir une liste

**Champs exclus :**
- Pas d'`auteur` : les données personnelles (nom, prénom, email) ne sont pas exposées au LLM
- Les brouillons (`statut: BROUILLON`) sont exclus
- Un objectif publié avec `contenu: null` est traité comme absent (`null` dans le champ correspondant)

### Instructions de sortie pour le LLM

```
Restitue chaque objectif avec sa date et son contenu verbatim, sans reformulation ni interprétation. Le contenu est en HTML : extrais uniquement le texte (sans les balises) tout en conservant la formulation d'origine. Ces objectifs représentent la vision nationale du chantier — ils ne sont pas spécifiques à un territoire donné. Ne reformule ou ne synthétise que si l'utilisateur le demande explicitement.
```

### Description du tool pour le LLM

```
Récupère les objectifs publiés d'un chantier :
- notre_ambition : ambition politique du chantier, objectifs, indicateurs et leviers
- deja_fait : principales avancées déjà réalisées
- a_faire : objectifs prioritaires et principales actions restant à mener

Ces objectifs sont rattachés au chantier au niveau national et ne sont pas territorialisés.
Utilise cet outil quand l'utilisateur demande l'ambition, les objectifs stratégiques, ce qui a été fait ou ce qui reste à faire sur un chantier — indépendamment d'un territoire.
```

---

## Modification de `get_chantier_commentaires`

### Suppressions

- Supprimer le paramètre `inclureObjectifs` de `GetChantierCommentairesQuery.execute()`
- Supprimer la requête sur la table `objectif` dans la query
- Supprimer les types `objectif_notre_ambition`, `objectif_deja_fait`, `objectif_a_faire` de la description du tool
- Mettre à jour la description du tool pour refléter qu'il ne retourne plus d'objectifs

### Impact sur le tool

La logique `inclureObjectifs: code === input.territoire_code` dans `getChantierCommentaires.ts` disparaît entièrement — la query ne prend plus ce paramètre.

---

## Plan d'implémentation

### 1. Nouvelle query : `GetChantierObjectifsQuery`

**Fichier :** `src/server/chantiers/query/GetChantierObjectifsQuery.ts`

- Requête Prisma sur `objectif` avec `WHERE chantier_id = ? AND statut = PUBLIE`
- Retourne les 3 types d'objectifs (au plus 1 par type)
- Mappe vers `ObjectifItem | null` par type
- Ne sélectionne pas les champs auteur (`auteur_creation_id`, `auteur_modification_id`)

### 2. Nouveau tool : `createGetChantierObjectifsTool`

**Fichier :** `src/server/albert/tools/getChantierObjectifs.ts`

Pattern identique aux autres tools Albert :

```typescript
export function createGetChantierObjectifsTool({
  getChantierObjectifsQuery,
}: {
  getChantierObjectifsQuery: GetChantierObjectifsQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({ ... });
  };
}
```

### 3. Enregistrement dans le module Albert

**Fichier :** `src/server/albert/module.ts`

- Ajouter `GetChantierObjectifsQuery` aux imports du module `chantiers`
- Enregistrer `createGetChantierObjectifsTool` dans le container

### 4. Câblage dans la route API

**Fichier :** `src/app/api/albert/chat/route.ts`

- Résoudre `createGetChantierObjectifsTool` depuis le container
- Instancier avec `{ chantiersAccessibles: session.habilitations.lecture.chantiers }`
- Ajouter `get_chantier_objectifs` à l'objet `tools`

### 5. Mise à jour du system prompt

**Fichier :** `src/server/albert/systemPrompt.ts`

- Documenter `get_chantier_objectifs` dans le protocole des tools
- Préciser la distinction avec `get_chantier_commentaires` :
  - `get_chantier_objectifs` → ambitions et objectifs stratégiques (vision nationale)
  - `get_chantier_commentaires` → analyses contextuelles sur un territoire (météo, freins, actions, réussites)

### 6. Modification de `GetChantierCommentairesQuery`

**Fichier :** `src/server/chantiers/query/GetChantierCommentairesQuery.ts`

- Supprimer le paramètre `inclureObjectifs` de l'interface et de l'implémentation
- Supprimer la requête Prisma sur `objectif`
- Supprimer le mapping des items `objectif_*` dans la liste de résultats

### 7. Modification de `getChantierCommentaires`

**Fichier :** `src/server/albert/tools/getChantierCommentaires.ts`

- Supprimer `inclureObjectifs: code === input.territoire_code` dans l'appel à la query
- Mettre à jour la description du tool (supprimer la mention des types `objectif_*`)

### 8. Tests

**Fichier :** `src/server/albert/__tests__/tools/getChantierObjectifs.unit.test.ts`

Cas à couvrir :
- Retourne les 3 objectifs quand tous sont publiés
- Retourne `null` pour un type absent ou avec `contenu: null`
- Retourne `null` pour les brouillons
- Lève une erreur si `chantier_id` n'est pas dans `chantiersAccessibles`
- Ne retourne pas de données auteur

---

## Cas limites

| Situation | Comportement attendu |
|-----------|----------------------|
| Aucun objectif publié | `{ notre_ambition: null, deja_fait: null, a_faire: null }` |
| Objectif publié avec `contenu: null` | Traité comme absent → `null` dans le champ |
| Utilisateur sans accès au niveau national mais avec accès au chantier | Autorisé — pas de vérification de territoire |
| Chantier non accessible (`chantiersAccessibles`) | Erreur `Accès non autorisé au chantier ${chantier_id}` |

---

## Ce qui ne change pas

- `TerritoireResolver` : non utilisé par ce tool
- Subagents : aucune modification nécessaire (ils ne référencent pas de noms de tools directement)
- Le format HTML des contenus : même instruction de strip au LLM que pour les commentaires
