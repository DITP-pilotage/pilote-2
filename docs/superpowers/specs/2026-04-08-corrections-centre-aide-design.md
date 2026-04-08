# Corrections Centre d'Aide - Retours Client

Date : 2026-04-08

## Contexte

Le client a fait une recette complète du nouveau centre d'aide custom PILOTE (admin + public). Ce document formalise les corrections et améliorations demandées, regroupées par domaine.

---

## 1. Corrections Editeur de texte

### 1.1 Bullet points : margin-left sur ul/ol

- Ajouter un `margin-left` (type `ml-6`) sur les `<ul>` et `<ol>` dans le rendu HTML (`RenduContenuHtml.tsx`)
- Appliquer aussi dans la preview admin pour la cohérence visuelle

**Fichiers impactés :**
- `src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx`

### 1.2 Blockquote : fix sanitizer

- Le sanitizer (`ArticleCentreAide.sanitizeHtml()`) strip la balise `<blockquote>`
- Ajouter `blockquote` à la whitelist de balises autorisées
- Vérifier que le style s'affiche correctement dans le rendu public (bordure gauche, etc.)

**Fichiers impactés :**
- `src/server/parametrage-centre-aide/domain/ArticleCentreAide.ts` (sanitizer)
- `src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx` (styles)

### 1.3 Liens mailto

- Dans `ModaleInsertionUrl.tsx`, ajouter un mode explicite dédié pour les liens `mailto:`
- L'utilisateur choisit le mode "Email", saisit l'adresse, le href `mailto:adresse@email.fr` est généré automatiquement
- Pas de détection automatique : choix explicite du mode par l'utilisateur

**Fichiers impactés :**
- `src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx`

---

## 2. Corrections Front

### 2.1 Largeur du centre d'aide public

- Remplacer le `px-48 md:px-96` par un `max-width` (type `max-w-screen-xl` ou valeur custom matchant l'ancien `--nextra-content-width`) centré avec `mx-auto`
- Le contenu prend `width: 100%` dans ce conteneur
- Layout 2 colonnes (arborescence + contenu) maintenu, pas de 3ème panneau "Sur cette page"

**Fichiers impactés :**
- `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`

### 2.2 Persistance de l'article sélectionné au refresh

- Stocker l'ID de l'article sélectionné dans un query param URL (`?article=<id>`)
- Utiliser **nuqs** (lib déjà disponible dans le projet) pour gérer le query param
- Au chargement : lire l'URL pour restaurer la sélection
- À chaque changement de sélection : mettre à jour l'URL via `router.replace` sans navigation complète

**Fichiers impactés :**
- `src/client/components/_commons/CentreAide/useLectureCentreAide.ts`
- `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`

### 2.3 Séparer nom d'arborescence / titre affiché

- Nouveau champ en base : `titre_affiche` (nullable) + `titre_affiche_brouillon` (nullable, pour le workflow brouillon)
- Migration Prisma pour ajouter ces colonnes
- Dans l'admin : deux inputs — "Nom (arborescence)" et "Titre affiché (contenu)"
- Côté public : l'arborescence utilise `titre`, le contenu affiche `titre_affiche` (fallback sur `titre` si vide)
- Exemple : arborescence = "Graphiques", titre affiché = "Analyser un indicateur : le graphique"

**Fichiers impactés :**
- `src/database/prisma/schema.prisma`
- Nouvelle migration Prisma
- `src/server/parametrage-centre-aide/domain/ArticleCentreAide.ts`
- `src/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat.ts`
- `src/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository.ts`
- `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`
- `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`

---

## 3. Feature Flags

### 3.1 Dissocier les deux feature flags

- Renommer `centreAideCustomPilote` en `centreAideAdmin`
  - Variable d'env : `NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN`
  - Contrôle : page `/panel-administrateur/centre-aide`
- Créer un nouveau FF `centreAidePilote`
  - Variable d'env : `NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE`
  - Contrôle : page `/centre-aide-pilote` + visibilité de l'onglet dans la navigation
- Workflow : activer l'admin d'abord pour préparer le contenu, puis activer le public quand prêt

**Fichiers impactés :**
- `src/config.ts`
- `src/pages/panel-administrateur/centre-aide.tsx`
- `src/pages/centre-aide-pilote.tsx`
- Navigation / header (onglet "Centre d'aide Pilote")
- Fichiers `.env` / `.env.example`

---

## 4. Fonctionnalites arborescence

### 4.1 Ouvrir/fermer les groupes

- Ajouter un chevron (>) à droite de chaque noeud de type `GROUPE` dans l'arborescence
- Clic sur le chevron : toggle expand/collapse des enfants
- Clic sur le nom du groupe : affiche le contenu (comportement actuel inchangé)
- Par défaut tous les groupes sont ouverts au chargement
- Pas de persistance de l'état ouvert/fermé entre sessions
- S'applique à l'arborescence admin ET publique

**Fichiers impactés :**
- `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`
- `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx`

### 4.2 Réordonner et déplacer les articles (admin uniquement)

4 actions disponibles sur chaque noeud dans l'arborescence admin :
- **Monter** : réordonner vers le haut au sein du même niveau (swap `ordre` avec le frère précédent)
- **Descendre** : réordonner vers le bas au sein du même niveau (swap `ordre` avec le frère suivant)
- **Sortir du groupe** : déplacer l'article au niveau du parent (modifier `parent_id` + recalculer `ordre`)
- **Entrer dans le groupe voisin** : déplacer l'article dans le groupe frère adjacent (modifier `parent_id` + recalculer `ordre`)

Mutation tRPC dédiée pour le réordonnancement, mise à jour des champs `ordre` et `parent_id` en base.

**Fichiers impactés :**
- `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx`
- `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts`
- `src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts`
- `src/server/parametrage-centre-aide/` (nouveau use case de réordonnancement)

### 4.3 Recherche dans l'arborescence

- Champ de recherche texte au-dessus de l'arborescence (composant partagé admin + public)
- Filtre les noeuds par nom (`titre`), en gardant les parents visibles pour le contexte de l'arbre
- Champ vide = retour à l'arborescence complète
- Recherche côté client (filtrage en mémoire, pas d'appel serveur)

**Fichiers impactés :**
- `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`
- `src/client/components/_commons/CentreAide/types.ts` (fonction de filtrage)
