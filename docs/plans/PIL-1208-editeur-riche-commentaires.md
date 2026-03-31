# PIL-1208 — Intégration de l'éditeur de texte enrichi sur les commentaires et météo

Date : 2026-03-31

## Contexte

Les formulaires de saisie des publications (commentaires) et de la synthèse des résultats utilisent actuellement un `<textarea>` natif. Le contenu est stocké en plain text dans les colonnes `contenu` / `commentaire` des tables `commentaire` et `synthese_des_resultats`. L'affichage remplace les `\n` par des `<br>` via `dangerouslySetInnerHTML` + DOMPurify.

L'objectif est d'intégrer `EditeurSimple` (TipTap) pour permettre la mise en forme enrichie (gras, italique, souligné, listes, liens), derrière un feature flag.

---

## Périmètre

Deux features impactées :
- **Publications / commentaires** (`commentaire` table) — tous types de maille et de commentaire
- **Synthèse des résultats** (`synthese_des_resultats` table)

Dans chaque feature, deux chemins de saisie sont impactés :
- Le formulaire inline (`FormulairePublication`, `SyntheseDesResultatsFormulaire`)
- Les modales portées par `BoutonNouvellePublication` et `BoutonEditerBrouillonPublication`

---

## Décisions

### 1. Schéma de données

**Nouvelle colonne** dans les deux tables :
- `commentaire.contenu_html` — `String?`
- `synthese_des_resultats.contenu_html` — `String?`

La colonne `contenu` (et `commentaire` pour `synthese_des_resultats`) est **dépréciée** : on cesse de l'écrire. Elle est conservée en base pour ne pas casser d'éventuelles lectures historiques mais n'est plus la source de vérité.

**Migration** : une migration Prisma convertit les valeurs existantes de `contenu` vers `contenu_html` selon les règles suivantes :
- Chaque double saut de ligne `\n\n` → `</p><p>`
- Chaque saut de ligne simple `\n` → `<br>`
- Le résultat est wrappé dans `<p>...</p>`
- Les enregistrements avec `contenu` null restent null dans `contenu_html`

```sql
UPDATE commentaire
SET contenu_html = '<p>' || REPLACE(REPLACE(contenu, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE contenu IS NOT NULL;

UPDATE synthese_des_resultats
SET contenu_html = '<p>' || REPLACE(REPLACE(commentaire, E'\n\n', '</p><p>'), E'\n', '<br>') || '</p>'
WHERE commentaire IS NOT NULL;
```

### 2. Feature flag

Un seul flag : `NEXT_PUBLIC_FF_EDITEUR_RICHE_COMMENTAIRES`

- Déclaré dans `VariableContenuDisponible.ts` (liste `FEATURE_FLIP_DEFINITIONS`)
- Déclaré dans `src/config.ts` (convict, valeur par défaut `false`)
- Accessible côté client via `useEnv("NEXT_PUBLIC_FF_EDITEUR_RICHE_COMMENTAIRES")`

**Scope du flag** : contrôle uniquement le **formulaire affiché** (EditeurSimple vs `<textarea>`). Il ne contrôle pas le rendu en lecture.

### 3. Formulaires — comportement selon le flag

#### FF = on → `EditeurSimple`

- Remplace le `<textarea>` par `<EditeurSimple>`
- Valeur soumise : `editor.getHTML()` — chaîne HTML
- La valeur est écrite directement dans `contenu_html`

**Gestion du paste :** TipTap configuré pour coller en plain text uniquement (extension `transformPastedText` ou option `transformPastedHTML` qui strip tous les tags).

#### FF = off → `<textarea>` (comportement actuel)

- Le contenu saisi est converti en HTML **avant** sauvegarde :
  - `\n\n` → `</p><p>`, `\n` → `<br>`, wrapping dans `<p>...</p>`
- La valeur convertie est écrite dans `contenu_html`

Cette conversion est factorisée dans un utilitaire partagé `plainTextToHtml(text: string): string`.

### 4. Validation Zod

#### Limite de caractères

Les limites sont inchangées et comptent les **caractères visibles** (texte extrait, sans balises) :
- Synthèse des résultats : `LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS = 1000`
- Publications : `LIMITE_CARACTÈRES_COMMENTAIRE` (5000 par défaut, configurable via `NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION`)

**Schéma Zod adapté :**

```ts
const contenuHtmlSchema = z
  .string()
  .refine(
    (html) => extractVisibleText(html).trim().length >= 1,
    { message: "Le contenu ne peut pas être vide." }
  )
  .refine(
    (html) => extractVisibleText(html).length <= LIMITE,
    { message: `Le contenu ne doit pas dépasser ${LIMITE} caractères.` }
  );
```

`extractVisibleText(html: string): string` — utilitaire qui parse le HTML et retourne `textContent` (sans balises). Utilisé aussi par le compteur de caractères.

#### Détection de l'état vide TipTap

TipTap retourne `<p></p>` quand l'éditeur est vide. `extractVisibleText("<p></p>").trim()` retourne `""` — la validation `.min(1)` bloque correctement. Pas de logique spéciale nécessaire côté TipTap.

### 5. Compteur de caractères

`CompteurCaractères` reçoit actuellement `watch("contenu")?.length ?? 0`. 

Avec l'éditeur riche, on passe `extractVisibleText(watch("contenu_html") ?? "").length`.

### 6. Affichage — `RenduContenuHtml`

Les deux composants d'affichage (`AffichagePublication`, `SynthèseDesRésultatsAffichage`) sont mis à jour pour :
1. Lire `contenu_html` en lieu et place de `contenu`
2. Remplacer `dangerouslySetInnerHTML` par `<RenduContenuHtml html={...} />`

`RenduContenuHtml` gère nativement tous les tags produits par `EditeurSimple` (`p`, `strong`, `em`, `u`, `a`, `ul`, `ol`, `li`, `br`) via son fallback générique `createElement`. Aucune modification du composant n'est nécessaire.

### 7. Troncature à 250 caractères visibles

Nouvelle fonction utilitaire `truncateHtml(html: string, maxChars: number): string` :

**Algorithme :**
1. Parser le HTML via `DOMParser`
2. Parcourir l'arbre DOM en DFS
3. Pour chaque nœud texte, compter ses caractères :
   - Si `compteur + nœud.length <= maxChars` : conserver le nœud entier, incrémenter le compteur
   - Si `compteur + nœud.length > maxChars` : tronquer le nœud texte à `maxChars - compteur` chars, ajouter `"..."`, arrêter le parcours
4. Sérialiser le DOM résultant via `XMLSerializer` (ou équivalent) → retourne du HTML valide avec toutes les balises fermées

La détection "faut-il afficher le bouton expand ?" se base sur `extractVisibleText(html).length > maxChars`.

---

## Composants et fichiers impactés

### Nouveaux utilitaires (`src/client/utils/html/`)
- `plainTextToHtml.ts` — conversion plain text → HTML
- `extractVisibleText.ts` — extraction du texte visible d'une chaîne HTML
- `truncateHtml.ts` — troncature HTML à N chars visibles avec HTML valide en sortie

### Schéma et migration
- `src/database/prisma/schema.prisma` — ajout de `contenu_html` dans `commentaire` et `synthese_des_resultats`
- Nouvelle migration Prisma

### Feature flag
- `src/server/gestion-contenu/domain/VariableContenuDisponible.ts` — ajout du flag
- `src/config.ts` — valeur par défaut `false`

### Formulaires
| Fichier | Modification |
|---|---|
| `FormulairePublication.tsx` | Remplace `<textarea>` par `<EditeurSimple>` (FF=on) ou conserve textarea avec conversion (FF=off) |
| `BoutonNouvellePublication.tsx` | Même chose dans la modale interne |
| `BoutonEditerBrouillonPublication.tsx` | Même chose dans la modale interne |
| `SyntheseDesResultatsFormulaire.tsx` | Remplace `<textarea>` par `<EditeurSimple>` (FF=on) ou conserve textarea avec conversion (FF=off) |

Dans chaque formulaire :
- Le champ s'appelle `contenu_html` (nouveau nom de champ react-hook-form)
- La validation Zod utilise `contenuHtmlSchema`
- Le compteur de caractères utilise `extractVisibleText`

### Affichage
| Fichier | Modification |
|---|---|
| `AffichagePublication.tsx` | Lit `contenu_html`, remplace `dangerouslySetInnerHTML` par `RenduContenuHtml`, troncature via `truncateHtml` |
| `SynthèseDesRésultatsAffichage/Affichage.tsx` | Idem |

### API / domaine
- Les use cases et repositories de publication et synthèse des résultats : lire/écrire `contenu_html` au lieu de `contenu`
- Les interfaces TypeScript (`Publication.interface.ts`, etc.) : ajout du champ `contenuHtml`

---

## Plan d'implémentation

### Étape 1 — Fondations transverses
1. Créer les utilitaires `plainTextToHtml`, `extractVisibleText`, `truncateHtml`
2. Ajouter `NEXT_PUBLIC_FF_EDITEUR_RICHE_COMMENTAIRES` dans config et `VariableContenuDisponible`
3. Migration Prisma : ajout colonne `contenu_html` + migration des données existantes

### Étape 2 — Couche domaine et API
4. Mettre à jour les interfaces TypeScript pour exposer `contenuHtml`
5. Mettre à jour les repositories (lecture de `contenu_html`, écriture dans `contenu_html`)
6. Adapter les schémas Zod de validation (utilisation de `extractVisibleText`)

### Étape 3 — Formulaires
7. Mettre à jour `FormulairePublication` (FF-switch + conversion textarea)
8. Mettre à jour `BoutonNouvellePublication` (modale)
9. Mettre à jour `BoutonEditerBrouillonPublication` (modale)
10. Mettre à jour `SyntheseDesResultatsFormulaire`

### Étape 4 — Affichage
11. Mettre à jour `AffichagePublication` (`RenduContenuHtml` + `truncateHtml`)
12. Mettre à jour `SynthèseDesRésultatsAffichage` (`RenduContenuHtml` + `truncateHtml`)

### Étape 5 — Tests
13. Tests unitaires : `plainTextToHtml`, `extractVisibleText`, `truncateHtml`
14. Tests unitaires : nouveaux schémas Zod (cas vide, limite dépassée, HTML valide)
15. Tests e2e : saisie riche → publication → affichage (FF=on)
16. Tests e2e : saisie textarea → publication → affichage HTML (FF=off)

---

## Cas limites notables

| Cas | Comportement attendu |
|---|---|
| Éditeur vide (`<p></p>`) | Validation bloque la soumission |
| Contenu exactement à la limite | Autorisé (≤ limite) |
| Contenu collé depuis le presse-papiers | Converti en plain text par TipTap avant insertion |
| `contenu_html` null en base (ancien enregistrement non migré) | Afficher "Non renseigné" (comportement déjà géré par les composants d'affichage) |
| FF désactivé après qu'un contenu HTML a été saisi | Le textarea affiche et soumet le HTML tel quel — acceptable car le FF ne devrait jamais reculer en production |
