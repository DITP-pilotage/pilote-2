# Plan de Migration du Centre d'Aide vers Nextra

## 1. Contexte et Objectifs

### Problème actuel
- **Système actuel** : Projet Retype séparé (HTML/JS pur) cloné via Git au moment du build
- **Points de friction** :
  - Build Retype sur GitHub instable (casse régulièrement)
  - Temps de build élevé
  - Dépendance externe avec token JWT pour clonage
  - Mécanisme complexe à maintenir : `scripts/clone_centre_aide.sh` clone `https://github.com/DITP-pilotage/centre-aide-pilote.git` (branche `retype-deploy`)
  - Rewrite Next.js `/centreaide/:slug*` → `/centreaide/:slug*/index.html`
  - Besoin de dupliquer pour un 2e centre d'aide

### Objectifs de la migration
✅ Migration rapide et simple (priorité)
✅ Éliminer les dépendances externes (token, clone Git)
✅ Conserver navigation automatique + recherche full-text
✅ Intégrer avec Tailwind (style proche DSFR déjà configuré)
✅ Support de 2 centres d'aide distincts : `/centreaide` et `/centreaide2`
✅ Maintenir l'édition directe via GitHub

### Contraintes
- ~20 fichiers Markdown par centre d'aide
- Mises à jour quotidiennes à hebdomadaires
- Images actuellement dans dossier static : `![](/static/image.png)`
- Contributeurs éditent directement sur GitHub
- **Architecture technique** : Next.js 14.2.32 avec **Pages Router**

---

## 2. Solution Technique Recommandée

### Choix : Nextra 3.x (Pages Router)

**Pourquoi Nextra 3.x ?**
- ✅ **Dernière version stable** supportant Pages Router (Nextra 4 nécessite App Router)
- ✅ Version moderne et bien maintenue (2024)
- ✅ Navigation automatique générée depuis la structure de fichiers
- ✅ Recherche full-text intégrée (FlexSearch optimisé)
- ✅ Support MDX pour composants React
- ✅ Configuration simple et rapide
- ✅ Thème personnalisable avec Tailwind
- ✅ Support multi-documentation natif
- ✅ Tous les bug fixes récents

**Alternatives considérées :**
- ❌ **Nextra 4** : Nécessite migration complète vers App Router (trop long, trop risqué)
- ❌ **Nextra 2** : Version plus ancienne, moins maintenue que la v3
- ❌ **Contentlayer** : Nécessite plus de développement custom (navigation, recherche)
- ❌ **Solution custom MDX** : Trop de développement (routing, search, navigation)

---

## 3. Architecture Proposée

### Structure des dossiers

```
projet/
├── src/pages/
│   ├── centreaide/                    # Centre d'aide principal
│   │   ├── index.mdx                  # Page d'accueil du centre d'aide
│   │   ├── guide-utilisateur.mdx      # Exemples de pages
│   │   ├── faq.mdx
│   │   ├── tutoriels/
│   │   │   ├── _meta.json             # Configuration navigation
│   │   │   ├── premier-pas.mdx
│   │   │   └── configuration.mdx
│   │   └── _meta.json                 # Navigation racine du centre d'aide
│   │
│   ├── centreaide2/                   # Futur 2e centre d'aide
│   │   ├── index.mdx
│   │   └── _meta.json
│   │
│   ├── _app.tsx                       # App globale (déjà existant)
│   └── ... (autres pages existantes)
│
├── public/
│   ├── centreaide/
│   │   └── images/                    # Images du centre d'aide 1
│   │       └── screenshot.png
│   └── centreaide2/
│       └── images/                    # Images du centre d'aide 2
│
├── next.config.js                     # + Config Nextra
├── theme.config.centreaide.tsx        # Config thème centre d'aide 1 (TypeScript)
├── theme.config.centreaide2.tsx       # Config thème centre d'aide 2 (futur)
└── tailwind.config.js                 # Déjà configuré avec couleurs DSFR
```

### Gestion des URLs

- `/centreaide/*` → Pages dans `src/pages/centreaide/`
- `/centreaide2/*` → Pages dans `src/pages/centreaide2/`
- Les rewrites actuels dans `next.config.js` seront **supprimés** (plus besoin)

### Gestion des images

Migration depuis `![](/static/image.png)` vers `![](/centreaide/images/image.png)` :
- Images dans `/public/centreaide/images/`
- Références Markdown : `![Description](/centreaide/images/screenshot.png)`

---

## 4. Plan de Migration Détaillé

### Phase 1 : Installation et Configuration (2-3h)

#### Étape 1.1 : Installation des dépendances Nextra

```bash
npm install nextra@latest nextra-theme-docs@latest
```

> **Note** : On utilise Nextra 3.x (dernière version stable pour Pages Router). La v3 est automatiquement installée avec `@latest` car la v4 est encore en alpha/beta.

#### Étape 1.2 : Configuration Next.js

Modifier `next.config.js` :

```javascript
// Avant (ligne 1)
/** @type {import('next').NextConfig} */
const https = require('https');

// Après
/** @type {import('next').NextConfig} */
const https = require('https');
const nextra = require('nextra');

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.centreaide.tsx',
  // Applique Nextra uniquement aux pages /centreaide/*
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  defaultShowCopyCode: true,
});
```

Puis envelopper la config existante :

```javascript
// Avant (ligne 63)
module.exports = nextConfig

// Après
module.exports = withNextra(nextConfig)
```

**Supprimer les rewrites** (lignes 8-15) car Nextra gère le routing automatiquement :

```javascript
// SUPPRIMER CE BLOC :
async rewrites() {
  return [
    {
      source: '/centreaide/:slug*',
      destination: '/centreaide/:slug*/index.html',
    },
  ]
},
```

#### Étape 1.3 : Créer la configuration du thème (TypeScript)

Créer `theme.config.centreaide.tsx` à la racine :

```tsx
import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <strong>Centre d'Aide PILOTE</strong>,
  project: {
    link: 'https://github.com/DITP-pilotage/pilote-2',
  },
  docsRepositoryBase: 'https://github.com/DITP-pilotage/pilote-2/tree/dev/src/pages/centreaide',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Centre d'Aide PILOTE',
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Documentation et centre d'aide pour PILOTE" />
    </>
  ),
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: true,
  footer: {
    text: `${new Date().getFullYear()} © DITP - Pilotage`,
  },
  editLink: {
    text: 'Modifier cette page sur GitHub →',
  },
  feedback: {
    content: 'Une question ? Signaler un problème →',
    labels: 'documentation',
  },
  primaryHue: {
    dark: 212,
    light: 212, // Bleu DSFR
  },
  search: {
    placeholder: 'Rechercher dans la documentation...',
  },
};

export default config;
```

> **Note** : Le type `DocsThemeConfig` assure la type-safety de la configuration et l'autocomplétion dans l'IDE.

#### Étape 1.4 : Mettre à jour Tailwind

Modifier `tailwind.config.js` pour inclure les fichiers Nextra :

```javascript
// Ligne 3 : Ajouter les MDX et fichiers de config Nextra
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./theme.config.*.tsx" // Pour le thème Nextra
],
```

#### Étape 1.5 : Adapter `_app.tsx` pour isoler Nextra

Nextra a son propre layout. Il faut éviter d'appliquer `MiseEnPage` aux pages Nextra.

Modifier `src/pages/_app.tsx` (ligne ~100-120, là où Component est rendu) :

```tsx
// Vérifier si c'est une page Nextra
const isNextraPage = Component.name === 'MDXContent' || router.pathname.startsWith('/centreaide');

return (
  <SessionProvider session={pageProps.session}>
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={200}>
        <Head>
          <link rel="icon" href="/favicon/favicon.ico" />
          {/* ... autres head tags */}
        </Head>

        {isNextraPage ? (
          // Pour les pages Nextra, pas de MiseEnPage
          <Component {...pageProps} />
        ) : (
          // Pour les pages normales, MiseEnPage comme avant
          <MiseEnPage>
            <Component {...pageProps} />
          </MiseEnPage>
        )}

        <Toaster {...toasterOptions} />
        {/* ... scripts DSFR etc */}
      </Tooltip.Provider>
    </QueryClientProvider>
  </SessionProvider>
);
```

---

### Phase 2 : Migration du Contenu (3-4h)

#### Étape 2.1 : Récupérer le contenu existant

Via l'interface GitHub, télécharger les fichiers MD de la branche `retype-deploy`.

#### Étape 2.2 : Convertir `.md` en `.mdx`

Renommer tous les fichiers `.md` en `.mdx` pour activer le support JSX :

```bash
cd src/pages/centreaide
for file in *.md; do
  mv "$file" "${file%.md}.mdx"
done
```

#### Étape 2.3 : Créer la navigation avec `_meta.ts` (TypeScript)

Créer `src/pages/centreaide/_meta.ts` pour définir l'ordre et les titres :

```typescript
import type { MetaRecord } from 'nextra';

const meta: MetaRecord = {
  index: {
    title: 'Accueil',
    theme: {
      breadcrumb: false,
    },
  },
  'guide-utilisateur': 'Guide Utilisateur',
  tutoriels: 'Tutoriels',
  faq: 'FAQ',
  contact: 'Contact',
};

export default meta;
```

Pour chaque sous-dossier, créer un `_meta.ts` typé :

```typescript
// src/pages/centreaide/tutoriels/_meta.ts
import type { MetaRecord } from 'nextra';

const meta: MetaRecord = { 
  'premier-pas': 'Premiers Pas',
  configuration: 'Configuration',
  avance: 'Fonctionnalités Avancées',
};

export default meta;
```

> **Note** : Le type `MetaRecord` de `nextra` assure la validation de la structure de navigation.

#### Étape 2.4 : Migration des images

```bash
# Créer le dossier des images
mkdir -p public/centreaide/images

# Copier les images depuis le repo cloné
cp -r /tmp/centreaide-migration/$CENTREAIDE_GITHUB_FOLDER/static/* public/centreaide/images/
```

**Mettre à jour les références d'images dans les MDX** :

manuellement : `![Description](/static/image.png)` → `![Description](/centreaide/images/image.png)`

#### Étape 2.5 : Créer la page d'accueil

Créer `src/pages/centreaide/index.mdx` :

```mdx
---
title: Centre d'Aide PILOTE
---

# Bienvenue dans le Centre d'Aide PILOTE

PILOTE est un outil de pilotage territorial pour les politiques prioritaires du Gouvernement français.

## Guides Rapides

- [Guide Utilisateur](/centreaide/guide-utilisateur) - Commencez ici
- [Tutoriels](/centreaide/tutoriels) - Apprenez par la pratique
- [FAQ](/centreaide/faq) - Questions fréquentes

## Besoin d'aide ?

Consultez notre [section Contact](/centreaide/contact) pour nous joindre.
```

---

### Phase 3 : Nettoyage et Tests (1-2h)

#### Étape 3.1 : Supprimer l'ancien système

**Supprimer le script de clonage** :

```bash
rm scripts/clone_centre_aide.sh
```

**Mettre à jour `package.json`** (ligne 10) :

```json
// Avant
"build": "next build && bash scripts/clone_centre_aide.sh && node copy-assets.js && prisma migrate deploy && prisma db seed",

// Après (supprimer la partie clone)
"build": "next build && node copy-assets.js && prisma migrate deploy && prisma db seed",
```

**Supprimer les variables d'environnement** :

Dans `.env` et `.env.example`, supprimer :
```bash
# SUPPRIMER CES LIGNES
CENTREAIDE_GITHUB_TOKEN=token
CENTREAIDE_GITHUB_FOLDER=prod
```

Dans `src/config.ts` (lignes ~150-160), supprimer les configs `CENTREAIDE_*`.

**Supprimer le dossier public/centreaide** (ancien build Retype) :

```bash
rm -rf public/centreaide
```

> **Important** : Ce dossier sera remplacé par `/public/centreaide/images/` pour les assets

#### Étape 3.2 : Tester en local

```bash
npm run dev
```

Vérifier :
- ✅ `http://localhost:3000/centreaide` affiche la page d'accueil
- ✅ Navigation automatique fonctionne (sidebar)
- ✅ Recherche full-text fonctionne (barre de recherche)
- ✅ Images s'affichent correctement
- ✅ Les liens internes fonctionnent
- ✅ Le style Tailwind s'applique
- ✅ Les autres pages de l'app fonctionnent normalement

#### Étape 3.3 : Tester le build production

```bash
npm run build
npm run start
```

Vérifier que le build réussit sans erreurs et que `/centreaide` fonctionne en mode production.

---

### Phase 4 : Préparation pour le 2e Centre d'Aide (30min - futur)

Quand le besoin du 2e centre d'aide arrivera :

#### Étape 4.1 : Créer la structure

```bash
mkdir -p src/pages/centreaide2
mkdir -p public/centreaide2/images
```

#### Étape 4.2 : Créer la config thème

Créer `theme.config.centreaide2.tsx` avec une config similaire mais adaptée (utiliser `DocsThemeConfig`).

#### Étape 4.3 : Mettre à jour `next.config.js`

Actuellement, Nextra s'applique globalement. Pour cibler spécifiquement `/centreaide` et `/centreaide2`, il faudra :

**Option 1 : Configurations séparées (recommandé)**

Créer 2 instances Nextra avec des matchers de routes :

```javascript
const withNextra1 = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.centreaide.tsx',
});

const withNextra2 = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.centreaide2.tsx',
});

// Composer les deux
module.exports = withNextra1(withNextra2(nextConfig));
```

**Option 2 : Config dynamique**

Utiliser un seul thème avec une fonction qui retourne une config différente selon le path.

> Note : Cette étape sera précisée quand le besoin arrivera.

---

## 5. Personnalisation Tailwind (Optionnel)

Si le style par défaut de Nextra ne correspond pas au design DSFR :

### Créer un fichier CSS custom

Créer `src/styles/nextra-custom.css` :

```css
/* Override Nextra avec couleurs DSFR */
.nextra-nav-container {
  @apply bg-white border-b border-dsfr-grey-925;
}

.nextra-sidebar-container {
  @apply bg-dsfr-grey-1000;
}

.nextra-nav-link {
  @apply text-primary hover:text-dsfr-blue-france-525;
}

.nextra-search-input {
  @apply border-dsfr-grey-925 focus:border-primary;
}

/* Utiliser les couleurs primary du tailwind.config.js */
.nextra-primary-hue {
  --nextra-primary-hue: 212;
}
```

Importer dans `_app.tsx` :

```tsx
import '@/styles/nextra-custom.css';
```

---

## 6. Checklist Finale de Migration

### Avant la migration

- [ ] Backup du dossier `/public/centreaide` actuel
- [ ] Backup de la config actuelle (`next.config.js`, `package.json`)
- [ ] Documenter les URLs actuelles du centre d'aide
- [ ] Prévenir les contributeurs de la migration

### Pendant la migration

- [ ] Installer Nextra 3.x
- [ ] Configurer `next.config.js` avec Nextra
- [ ] Créer `theme.config.centreaide.tsx` (typé avec `DocsThemeConfig`)
- [ ] Adapter `_app.tsx` pour isoler Nextra
- [ ] Migrer les fichiers `.md` → `.mdx` dans `/src/pages/centreaide/`
- [ ] Créer les `_meta.ts` pour la navigation (typé avec `MetaRecord`)
- [ ] Migrer les images dans `/public/centreaide/images/`
- [ ] Mettre à jour les références d'images dans les MDX
- [ ] Supprimer `scripts/clone_centre_aide.sh`
- [ ] Supprimer les variables d'environnement `CENTREAIDE_*`
- [ ] Mettre à jour le script `build` dans `package.json`
- [ ] Nettoyer l'ancien `/public/centreaide`

### Tests

- [ ] Test local : `npm run dev` → vérifier `/centreaide`
- [ ] Vérifier la navigation automatique (sidebar)
- [ ] Vérifier la recherche full-text
- [ ] Vérifier l'affichage des images
- [ ] Vérifier les liens internes
- [ ] Test build : `npm run build` → vérifier qu'il réussit
- [ ] Test production : `npm run start` → vérifier `/centreaide`
- [ ] Vérifier que les autres pages de l'app fonctionnent normalement

### Après la migration

- [ ] Déployer sur l'environnement de dev/staging
- [ ] Vérifier en conditions réelles
- [ ] Mettre à jour la documentation contributeur
- [ ] Supprimer le token `CENTREAIDE_GITHUB_TOKEN` de GitHub Secrets
- [ ] Archiver ou supprimer le repo `centre-aide-pilote` (si plus nécessaire)

---

## 7. Risques et Mitigation

### Risques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Conflit entre layout Nextra et MiseEnPage | Moyen | Élevée | Isoler Nextra dans `_app.tsx` avec check du pathname |
| Perte de SEO/URLs pendant la migration | Faible | Faible | Les URLs restent identiques (`/centreaide/*`) |
| Build qui casse à cause de Nextra | Moyen | Faible | Tester le build avant déploiement, rollback facile |
| Conflit Tailwind avec styles Nextra | Faible | Moyenne | Créer `nextra-custom.css` pour overrides |
| Images cassées après migration | Faible | Moyenne | Script de migration automatisé + vérification |

---

## 8. Points d'Attention

### Compatibilité

- ✅ **Nextra 3.x** est la dernière version stable pour Pages Router (2024)
- ⚠️ Migration future vers Nextra 4 nécessitera migration vers App Router
- ✅ Pas de breaking changes prévus à court terme pour la v3

### Performance

- ✅ Nextra génère des pages statiques → performance excellente
- ✅ Recherche FlexSearch côté client → rapide
- ✅ Pas de dépendance externe → build rapide

### Maintenance

- ✅ Les contributeurs éditent les `.mdx` directement sur GitHub (comme avant)
- ✅ Pas de build externe à gérer (Retype)
- ✅ Navigation générée automatiquement via `_meta.ts` (typé avec TypeScript)
- ⚠️ Besoin de maintenir les `_meta.ts` lors de l'ajout de pages
- ✅ Type-safety complète avec `DocsThemeConfig` et `MetaRecord`

---

## 9. Fichiers Critiques à Modifier

| Fichier | Action | Priorité |
|---------|--------|----------|
| `next.config.js` | Ajouter Nextra, supprimer rewrites | 🔴 Critique |
| `package.json` | Ajouter dépendances, modifier script build | 🔴 Critique |
| `theme.config.centreaide.tsx` | Créer (nouveau, TypeScript) | 🔴 Critique |
| `src/pages/_app.tsx` | Isoler Nextra du layout MiseEnPage | 🔴 Critique |
| `src/pages/centreaide/` | Créer structure + migrer MDX | 🔴 Critique |
| `src/pages/centreaide/_meta.ts` | Créer navigation (TypeScript) | 🔴 Critique |
| `public/centreaide/images/` | Migrer les images | 🟡 Important |
| `tailwind.config.js` | Inclure fichiers MDX et .tsx | 🟡 Important |
| `scripts/clone_centre_aide.sh` | Supprimer | 🟢 Nettoyage |
| `.env`, `.env.example` | Supprimer CENTREAIDE_* | 🟢 Nettoyage |
| `src/config.ts` | Supprimer configs CENTREAIDE_* | 🟢 Nettoyage |

---

## 10. Temps Estimé Total

| Phase | Durée Estimée |
|-------|---------------|
| Phase 1 : Installation et Configuration | 2-3h |
| Phase 2 : Migration du Contenu | 3-4h |
| Phase 3 : Nettoyage et Tests | 1-2h |
| **Total** | **6-9h** |

> **Note** : Temps pour une personne familière avec Next.js et Nextra. Peut varier selon le volume de contenu.

---

## 11. Ressources et Documentation

- [Nextra Documentation (v2)](https://nextra.site)
- [Nextra GitHub (v2 branch)](https://github.com/shuding/nextra/tree/v2)
- [Next.js Pages Router](https://nextjs.org/docs/pages)
- [MDX Documentation](https://mdxjs.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## 12. Conclusion

Cette migration vers Nextra 3.x permettra de :

✅ **Simplifier drastiquement** le workflow de publication
✅ **Éliminer les dépendances externes** fragiles (Retype, token GitHub)
✅ **Améliorer la maintenabilité** (tout dans un seul repo)
✅ **Conserver toutes les features essentielles** (navigation auto, recherche)
✅ **Préparer le terrain** pour un 2e centre d'aide facilement
✅ **Réduire le temps de build** (pas de clone Git externe)

La migration est **rapide** (6-9h), **peu risquée** (rollback facile), et apporte des **bénéfices immédiats**.
