# 9. Spécification du tool Albert `get_chantier_commentaires`

Date : 2026-08-25

## Statut

Proposé

## Contexte

Le tool Albert `get_chantier_commentaires` permet au LLM de restituer les informations qualitatives publiées d'un chantier. La version actuelle expose six types de commentaires mélangés dans une structure plate, inclut des données personnelles (nom de l'auteur), n'expose pas la météo, n'inclut pas les décisions stratégiques, et envoie le HTML brut au LLM.

Cette spec couvre la refonte du tool pour aligner son comportement sur les règles métier documentées dans l'US et les décisions de conception prises lors de la session de conception.

## Périmètre fonctionnel

### Contenus couverts par ce tool

| Catégorie | Modèle Prisma | Territorialisation | Maille |
|---|---|---|---|
| Synthèse des résultats (météo + commentaire) | `synthese_des_resultats` | `chantier × territoire` | NAT, REG, DEPT |
| Commentaires maille nationale | `commentaire` | `chantier × territoire (NAT-FR)` | NAT |
| Commentaires maille régionale/départementale | `commentaire` | `chantier × territoire (REG ou DEPT)` | REG, DEPT |
| Décisions stratégiques | `decision_strategique` | chantier uniquement (non territorialisé) | NAT uniquement |

### Contenus exclus de ce tool

- Les objectifs du chantier (`notre_ambition`, `deja_fait`, `a_faire`) → traités par `get_chantier_objectifs`.
- Les brouillons (`statut = BROUILLON`).

## Types de contenu par maille

### Maille nationale (`NAT-FR`)

Types de commentaires (`commentaire.type`) :
- `autres_resultats_obtenus_non_correles_aux_indicateurs` : résultats importants qui ne transparaissent pas dans les indicateurs
- `freins_a_lever` : risques et freins identifiés, notamment ceux nécessitant un soutien ou arbitrage
- `actions_a_venir` : solutions envisagées, actions initiées ou prévues
- `actions_a_valoriser` : exemples concrets de réussite à partager

### Maille régionale et départementale (`REG-xx`, `DEPT-xx`)

Types de commentaires (`commentaire.type`) :
- `commentaires_sur_les_donnees` : explication des résultats du territoire et des écarts éventuels
- `autres_resultats_obtenus` : résultats locaux qui ne transparaissent pas dans les chiffres

### Toutes mailles

- `synthese_des_resultats` : météo (qualification du niveau de confiance dans l'atteinte des objectifs) et analyse textuelle associée — issus du même enregistrement Prisma

### Décisions stratégiques (uniquement NAT-FR)

Type fonctionnel : `suivi_des_decisions_strategiques`. Décisions prises lors des réunions Élysée-Matignon, actions envisagées ou réalisées.

## Valeurs métier de la météo

| Valeur DB | Libellé restitué |
|---|---|
| `SOLEIL` | Objectifs sécurisés |
| `COUVERT` | Objectifs atteignables |
| `NUAGE` | Appuis nécessaires |
| `ORAGE` | Objectifs compromis |
| `NON_RENSEIGNEE` | Non renseignée |
| `NON_NECESSAIRE` | Non nécessaire |

## Structure de l'output

Chaque élément du tableau `resultats` correspond à un territoire et suit la structure suivante :

```typescript
type ChantierCommentaireParTerritoire = {
  territoire_code: string;
  maille: "nationale" | "régionale" | "départementale";
  synthese_des_resultats: {
    meteo: {
      valeur: string;   // ex: "SOLEIL"
      libelle: string;  // ex: "Objectifs sécurisés"
    } | null;
    contenu: string | null;   // texte extrait du HTML, sans balises
    date_publication: string; // ISO 8601
  } | null;
  commentaires: {
    type: string;             // ex: "freins_a_lever"
    contenu: string;          // texte extrait du HTML, sans balises
    date_publication: string; // ISO 8601
  }[];
  decisions_strategiques: {
    contenu: string;          // texte extrait du HTML, sans balises
    date_publication: string; // ISO 8601
  }[]; // tableau vide pour les territoires non-nationaux
};

type GetChantierCommentairesOutput = {
  resultats: ChantierCommentaireParTerritoire[];
  _output_instructions: string;
};
```

**Points clés de la structure :**
- `maille` est toujours exposé explicitement (ne pas laisser Albert inférer depuis le code)
- Le champ `auteur` est absent (données personnelles)
- Le HTML est extrait côté serveur avant envoi au LLM (via `extractVisibleText`)
- `decisions_strategiques` est un tableau vide pour tous les territoires non-nationaux
- Un territoire sans aucun contenu publié apparaît quand même dans `resultats` avec tous ses tableaux vides et ses champs nulls, pour signaler explicitement l'absence de contenu

## Contrôles d'accès

### Territoire principal

```
if (!territoiresAccessibles.includes(input.territoire_code)) throw Error
```

### Sous-territoires

Les sous-territoires résolus sont filtrés à l'intersection avec `territoiresAccessibles`. Un sous-territoire non accessible est silencieusement exclu du résultat.

### Décisions stratégiques

Les décisions stratégiques ne sont requêtées et retournées que si `NAT-FR` est présent dans `territoiresAccessibles` ET que le territoire résolu inclut `NAT-FR`. Un utilisateur n'ayant accès qu'à `REG-11` ne voit pas les décisions stratégiques, même s'il appelle le tool avec `include_sous_territoires=false`.

## Règle de non-duplication des décisions stratégiques

Les décisions stratégiques sont liées au chantier uniquement (`chantier_identite`) — elles ne sont pas territorialisées. Lors d'un appel avec `NAT-FR + include_sous_territoires=true`, le resolver retourne `[NAT-FR, REG-11, REG-21, ...]`. Les décisions stratégiques ne doivent figurer que dans l'entrée `NAT-FR` du résultat, jamais dans les entrées des sous-territoires.

Cette règle est encodée dans l'implémentation (la requête `decision_strategique` n'est lancée que pour `NAT-FR`), pas laissée au prompt système.

## Extraction du HTML

Le contenu HTML (`contenu`, `commentaire`) est extrait côté serveur via l'utilitaire `extractVisibleText` avant d'être envoyé au LLM. Le champ `_output_instructions` n'a plus besoin de demander à Albert de faire cette extraction lui-même.

## Comportement quand `include_sous_territoires = false` (défaut)

- Seul le territoire demandé est interrogé.
- Si le territoire est `NAT-FR` et que l'utilisateur y a accès, les décisions stratégiques sont incluses.
- Les commentaires retournés sont ceux du territoire uniquement.

## Comportement quand `include_sous_territoires = true`

- Le resolver retourne le territoire demandé + ses enfants directs.
  - `NAT-FR` → `[NAT-FR, REG-11, REG-21, ...]`
  - `REG-11` → `[REG-11, DEPT-75, DEPT-77, ...]`
  - `DEPT-xx` → `[DEPT-xx]` (aucun enfant)
- Les décisions stratégiques n'apparaissent que dans l'entrée `NAT-FR`, même si d'autres territoires sont résolus.
- Les contenus nationaux (commentaires `NAT-FR`) n'apparaissent qu'une fois dans l'entrée `NAT-FR`.

## Description du tool pour le LLM

La description doit :
- Distinguer explicitement les types de commentaires par maille
- Indiquer que la synthèse des résultats (météo + commentaire) est territorialisée
- Indiquer que les décisions stratégiques ne sont disponibles que pour `NAT-FR`
- Renvoyer vers `get_chantier_objectifs` pour les objectifs stratégiques (`notre_ambition`, `deja_fait`, `a_faire`)

## Plan d'implémentation

Les étapes sont ordonnées par dépendance : chaque étape peut être développée et testée indépendamment.

---

### Étape 1 — Refactorer `GetChantierCommentairesQuery`

**Fichier à modifier :** `src/server/chantiers/query/GetChantierCommentairesQuery.ts`

Les décisions stratégiques sont intégrées directement dans cette query : elle mélange déjà `commentaire` et `synthese_des_resultats`, et reçoit déjà `territoireCode` — la condition `territoireCode === "NAT-FR"` suffit à déclencher la requête supplémentaire sans nouvelle classe ni nouveau point d'injection.

Changements :

1. **Supprimer** `include: { auteur_modification: true }` des deux requêtes Prisma existantes.

2. **Ajouter** le champ `meteo` à la sélection Prisma de `synthese_des_resultats`. Supprimer le filtre `commentaire: { not: null }` — on retourne la synthèse même si le commentaire est null (la météo peut être renseignée sans commentaire).

3. **Ajouter la requête `decision_strategique`** en parallèle, conditionnée à `territoireCode === "NAT-FR"` :
   ```typescript
   const [commentaires, syntheses, decisions] = await Promise.all([
     prisma.commentaire.findMany({ ... }),
     prisma.synthese_des_resultats.findMany({ ... }),
     params.territoireCode === "NAT-FR"
       ? prisma.decision_strategique.findMany({
           where: { chantier_id: params.chantierId, statut: $Enums.statut_publication.PUBLIE },
           orderBy: { date_modification: "desc" },
         })
       : Promise.resolve([]),
   ]);
   ```
   Pas de `include` auteur sur cette requête.

4. **Changer le type de retour** — remplacer la liste plate `commentaires` par la structure groupée :
   ```typescript
   export type GetChantierCommentairesResult = {
     territoire_code: string;
     maille: "nationale" | "régionale" | "départementale";
     synthese_des_resultats: {
       meteo: { valeur: string; libelle: string } | null;
       contenu: string | null;
       date_publication: string;
     } | null;
     commentaires: {
       type: string;
       contenu: string;
       date_publication: string;
     }[];
     decisions_strategiques: {
       contenu: string;
       date_publication: string;
     }[];
   };
   ```

5. **Dériver `maille`** depuis le préfixe du `territoire_code` :
   ```typescript
   function mailleFromCode(code: string): "nationale" | "régionale" | "départementale" {
     if (code.startsWith("NAT-")) return "nationale";
     if (code.startsWith("REG-")) return "régionale";
     return "départementale";
   }
   ```

6. **Appliquer `extractVisibleText`** sur `commentaire.contenu`, `synthese.commentaire` et `decision.contenu`.

7. **Mapper la météo** vers son libellé métier via `libellesMeteos` depuis `@/server/domain/météo/Météo.interface`.

---

### Étape 2 — Refactorer `createGetChantierCommentairesTool`

**Fichier à modifier :** `src/server/albert/tools/getChantierCommentaires.ts`

La signature des deps du tool ne change pas — `getChantierDecisionsStrategiquesQuery` n'est pas injecté, les décisions sont désormais gérées dans la query. La logique NAT-FR et le contrôle d'accès aux décisions stratégiques restent dans le tool.

**Logique `execute` mise à jour :**

```typescript
execute: async (input): Promise<GetChantierCommentairesOutput> => {
  // Contrôle d'accès au territoire principal (inchangé)
  if (!territoiresAccessibles.includes(input.territoire_code)) {
    throw new Error(`Accès non autorisé au territoire ${input.territoire_code}`);
  }

  // Résolution des territoires (inchangée)
  const codes = await territoireResolver.resoudre(
    input.territoire_code,
    input.include_sous_territoires,
  );

  // Filtrage accès + masquage des décisions si NAT-FR non accessible
  const codesAccessibles = codes
    .filter((code) => territoiresAccessibles.includes(code))
    .map((code) =>
      code === "NAT-FR" && !territoiresAccessibles.includes("NAT-FR")
        ? null
        : code,
    )
    .filter(Boolean);

  const resultats = await Promise.all(
    codesAccessibles.map((code) =>
      getChantierCommentairesQuery.execute({
        territoireCode: code,
        chantierId: input.chantier_id,
      }),
    ),
  );

  return { resultats, _output_instructions: OUTPUT_INSTRUCTIONS };
}
```

Note : le filtre sur `NAT-FR` dans l'accès aux décisions stratégiques est déjà garanti par le filtre `territoiresAccessibles` sur `codesAccessibles`. Si `NAT-FR` n'est pas accessible, il n'est pas dans `codesAccessibles`, donc la query ne l'appelle pas, donc `decisions_strategiques` est vide dans le résultat. Pas de logique supplémentaire nécessaire dans le tool.

**Mettre à jour `OUTPUT_INSTRUCTIONS`** : supprimer l'instruction demandant à Albert d'extraire le HTML (fait côté serveur). Garder uniquement les instructions de restitution métier.

**Mettre à jour la description du tool** :
- Documenter les types de commentaires par maille
- Mentionner que météo + commentaire sont dans `synthese_des_resultats`
- Mentionner que les décisions stratégiques ne sont disponibles que pour `NAT-FR`
- Renvoyer vers `get_chantier_objectifs` pour les objectifs

**Type de sortie :** `GetChantierCommentairesResult` contient déjà `decisions_strategiques` — le type `GetChantierCommentairesOutput` n'a pas besoin de changer de structure, seulement de référencer le type mis à jour.

---

### Étape 3 — Créer le test unitaire du tool

**Fichier à créer :** `src/server/albert/__tests__/tools/getChantierCommentaires.unit.test.ts`

Pattern de référence : `getChantierObjectifs.unit.test.ts` (même répertoire). La query est mockée via `vitest-mock-extended`, le tool est instancié réellement.

Les cas à couvrir :

| Cas | Ce qu'on vérifie |
|---|---|
| Territoire principal non accessible | `rejects.toThrow("Accès non autorisé")` |
| Territoire accessible, commentaires publiés | structure de sortie complète avec `maille`, `synthese_des_resultats`, `commentaires` |
| Territoire sans aucun contenu publié | résultat présent avec `synthese_des_resultats: null`, `commentaires: []`, `decisions_strategiques: []` |
| `territoire_code = NAT-FR` avec accès NAT-FR | `decisions_strategiques` peuplées dans le résultat NAT-FR |
| `territoire_code = REG-11` (pas NAT-FR) | `decisions_strategiques: []` même si la query renvoie des données |
| NAT-FR dans les codes résolus mais absent de `territoiresAccessibles` | NAT-FR exclu du résultat, ses décisions non exposées |
| Pas de données `auteur` dans la sortie | aucun champ `auteur` dans `commentaires`, `synthese_des_resultats` ou `decisions_strategiques` |

Note : `GetChantierCommentairesQuery` est mockée — les tests du tool vérifient uniquement la logique d'orchestration (accès, résolution de territoire, injection des décisions). La logique interne de la query (extraction HTML, mapping météo) est à tester séparément si des tests de query sont ajoutés.

## Décision

Appliquer l'ensemble des changements décrits dans cette spec sur le tool `get_chantier_commentaires` et sa query sous-jacente `GetChantierCommentairesQuery`.

## Conséquences

- Le LLM reçoit une structure explicite et sans ambiguïté sur la nature et la maille de chaque contenu.
- Les données personnelles (nom de l'auteur) ne sont plus exposées à Albert.
- Les décisions stratégiques sont accessibles via ce tool uniquement pour les utilisateurs ayant accès à `NAT-FR`.
- La météo est désormais restituée avec son libellé métier, imbriquée dans `synthese_des_resultats`.
- Le HTML n'est plus envoyé au LLM.
- Les territoires sans contenu sont visibles dans la réponse (absence explicite).
