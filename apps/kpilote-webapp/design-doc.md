# mb-webapp — Design doc

Analyse comparative de l'identité visuelle des sites gouvernementaux français « nouvelle école » (LaSuite, Immersion Facile, MesServices Cyber) pour guider la UI de mb-webapp.

## 1. Le contexte : qu'est-ce qu'un site gouv français ?

Avant de parler de ce qui les distingue, il faut comprendre les **invariants** imposés par la charte de l'État. Ce sont les éléments qu'on ne peut pas négocier — ils signent l'identité « République Française » et créent la confiance institutionnelle.

### Les invariants chartés

- **Bloc-marque** : le « GOUVERNEMENT / Liberté · Égalité · Fraternité » avec drapeau, ancré en haut-gauche. C'est la seule chose immuable.
- **Bleu République** (`#000091`) comme couleur de marque. Saturé, profond, jamais délavé.
- **Marianne** comme typeface officielle (sans-serif géométrique humaniste, dessinée pour l'État).
- **Système DSFR** (Système de Design de l'État) comme socle théorique — mais pas obligatoire en pratique pour les outils internes.
- **Liens RGPD / accessibilité / mentions légales** en footer.

### Ce qui fait « vieille école » (impots.gouv comme contre-modèle)

- **Bandeau bleu pleine largeur** qui écrase le contenu : ça date du web 2010.
- **Densité d'information** maximale dès le hero, peu de respiration.
- **Tableaux et listes nues** sans hiérarchie tonale.
- **Multiplication des poids et tailles** de typo (4-5 niveaux sur la même vue).
- **Photographie institutionnelle** stockée, peu d'illustration native.
- **Borders gris foncé partout**, conteneurs visuellement « scellés ».
- **CTA hétérogènes** : plusieurs couleurs, plusieurs styles, plusieurs radius.

---

## 2. L'essence des sites modernes (LaSuite, Immersion Facile)

Ce qui les différencie d'impots.gouv tient en **un mot** : **respiration**. Tout le reste découle de là.

### 2.1 Composition & rythme

**Macro-layout : grilles asymétriques généreuses.**

- Hero typique : 50/50 ou 60/40 — texte à gauche, illustration vectorielle à droite, axés sur la même baseline.
- Padding vertical de section : **96-160px**, jamais moins de 64. La page « scrolle long » mais respire.
- Largeur max contenu : 1200-1280px centré, avec marges latérales conséquentes (>120px sur desktop).
- Les sections alternent fond `white` / fond `off-white tinted` (cf. §2.3) pour découper le rythme sans border.

**Densité contrôlée.**

- Une idée par section. Une seule. Si on doit en présenter 5 (cf. « LaSuite en un coup d'œil »), on les pose **en ligne**, jamais empilées, avec un même gabarit (icône + titre + 1 phrase).
- Le contenu textuel d'un bloc dépasse rarement 3 phrases avant un break visuel.

### 2.2 Typographie

**Type scale très contrastée — c'est le signal #1 de modernité.**

| Rôle                 | Taille (desktop) | Poids                                | Tracking |
| -------------------- | ---------------- | ------------------------------------ | -------- |
| Display (hero title) | 56-72px          | 700-800 (Bold/ExtraBold)             | -0.02em  |
| H2 section           | 36-44px          | 700                                  | -0.01em  |
| H3 card              | 20-24px          | 600-700                              | 0        |
| Lead paragraph       | 18-20px          | 400                                  | 0        |
| Body                 | 16px             | 400                                  | 0        |
| Caption / eyebrow    | 12-13px          | 600, **uppercase**, tracking +0.08em |          |

Points-clés :

- **Display énorme + body classique** : c'est l'écart 4-5x qui crée la sensation « moderne ». Pas la fonte elle-même.
- **Marianne** (ou un substitut comme Inter) en sans-serif géométrique. **Pas de serif** dans le corps.
- **Leading généreux** : 1.5-1.6 sur le body, 1.1-1.2 sur les displays.
- **Eyebrow labels** colorés en bleu République, petits, capitalisés (cf. « DÉCOUVERTE / SIMPLICITÉ / OPPORTUNITÉ » d'Immersion Facile) pour catégoriser sans alourdir.
- **Chiffres en display type** pour storyteller par la donnée (« 100% », « 7/10 », « 1 jour »).

### 2.3 Palette chromatique

**Monochromie volontaire + un accent.** C'est le contraire de l'arc-en-ciel administratif.

```
Background app      #FFFFFF (blanc pur)
Background section  #F5F5FE  ← off-white tinté lavande (signature LaSuite)
                    #F6F6F6  ← variante neutre gris-froid
Surface card        #FFFFFF
Border subtle       #E5E5E5 / rgba(0,0,0,0.06)
Text primary        #161616 (presque noir, pas pur)
Text secondary      #666666
Text muted          #929292

Accent — Bleu République
  Primary           #000091
  Primary hover     #1212A8
  Primary tinted    #ECECFE (background hover / selected)
```

Règles :

- **Le bleu République est un accent, pas un bandeau.** Il sert les CTA primaires, les liens, les icônes signal. Il n'occupe jamais plus de 5-10% de la surface visible.
- **Pas de gradient.** Jamais. C'est un signal « SaaS B2B 2018 », pas « gouv 2025 ».
- **Pas d'ombre marquée.** Soit pas d'ombre (cards plates sur background tinté), soit shadow ultra-subtile (`0 1px 2px rgba(0,0,0,0.04)`).
- **Background tinté lavande** (`#F5F5FE`) : la signature visuelle qui « réchauffe » le blanc sans saturer. C'est ce qui distingue LaSuite d'un Stripe générique.

### 2.4 Iconographie & illustration

**Système d'illustration cohérent — c'est le signal #2 de modernité.**

Deux niveaux :

**Spot illustrations (hero, sections clés).**

- Style « flat avec accents géométriques », personnages stylisés sans visage détaillé.
- Palette restreinte : bleu République + un rouge brique (`#C9191E` ou `#E1000F`) + un beige/sable + noir + blanc.
- **Pas de skeuomorphisme.** Pas d'ombres réalistes. Lignes nettes.
- Style proche de l'illustrateur « Notion / Stripe » mais avec les codes couleur français.

**Icônes UI.**

- **Outline monochrome**, 1.5-2px stroke, coins arrondis (« stroke-linecap: round »).
- Taille standard 20-24px. Bleu République pour les icônes signifiantes, gris foncé pour les neutres.
- Style proche de **Lucide / Tabler / Phosphor**. Éviter Heroicons solid (trop SaaS US).

### 2.5 Cards & containers

- **Border-radius** : `8-12px` sur les cards, `16px` sur les conteneurs hero. Jamais > 16px (signal « consumer app »), jamais < 4px (signal « legacy »).
- **Padding interne généreux** : 24-32px sur les cards, 48-64px sur les conteneurs.
- **Borders très légères** ou **absentes** — la séparation se fait par le tinted background, pas par un trait.
- **Pas de séparateurs verticaux** entre colonnes.

### 2.6 Boutons & CTA

Système binaire strict :

```
Primary    fond plein #000091, texte blanc, radius 6-8px, padding 12px 24px, font-weight 600
Secondary  fond blanc, texte #000091, border 1px #000091, mêmes métriques
Tertiary   pas de fond, texte #000091 souligné au hover
```

- **Toujours un seul primary par section visible.**
- **Texte de CTA verbal et bref** : « Se connecter », « Essayer maintenant », « Découvrir les outils ». Pas de « Cliquez ici » ni de phrase complète.
- **Pas de chevron à droite** sur les CTA standards (réservé aux liens « lire la suite »).
- **Pas d'icône dans le bouton** sauf cas justifié (`+ Nouveau`).

### 2.7 Mockups produit dans la landing

Pattern récurrent : un screenshot UI réel posé dans le hero ou en mi-page.

- **Window chrome stylisé** : 3 dots macOS-like en haut-gauche, ou pas de chrome du tout.
- **Border-radius 12-16px** sur le mockup, shadow douce (`0 20px 40px rgba(0,0,0,0.08)`).
- **Parfois tilté** légèrement (FranceTransfert) pour suggérer la profondeur sans 3D.
- **Le mockup montre le produit en action** avec des vraies données (pas du Lorem Ipsum).

### 2.8 Trust signals

- Bandeau **« Utilisé par X ministères »** + logos officiels en grisé/sobre, alignés à hauteur de x-height.
- Chiffres clés (« 500 000 agents », « 15 ministères ») en body weight, jamais en display, posés sans emphase visuelle excessive.
- **Pas de témoignages quotes avec photos rondes** (signal SaaS US).

---

## 3. Application à mb-webapp

mb-webapp est un **outil interne** pour des agents publics, pas une landing. Mais l'identité visuelle doit puiser dans la même grammaire que LaSuite — c'est le contexte mental de nos utilisateurs.

### 3.1 Décisions à valider

1. **Palette** : passer le `--color-primary` actuel (slate-900 quasi-noir) au **Bleu République `#000091`** ? Ou garder la neutralité actuelle (plus « Linear / Notion ») et ne pas s'aligner sur la grammaire gouv ?
2. **Background tinté** : adopter le `#F5F5FE` lavande de LaSuite comme background de sections, ou rester sur slate-50 ?
3. **Bloc-marque GOUVERNEMENT** : présent dans le header ou pas ? Selon le statut de l'outil (interne agent vs visible citoyen) la réponse change.
4. **Typeface** : Marianne (officielle, à licence) ou Inter (proche visuellement, libre) ?

### 3.2 Règles non-négociables pour la suite

Indépendamment des choix ci-dessus, voici les invariants à respecter dans toute UI mb-webapp :

- **Type scale contrastée** : ratio display/body au moins 3x, jamais d'empilement de 4 tailles intermédiaires.
- **Eyebrow labels** uppercase tracking-wide pour catégoriser les sections de dashboard.
- **Iconographie outline unique** (Lucide ou équivalent) — pas de mix solid/outline.
- **Binôme CTA** : primary plein / secondary outline. Pas de troisième style.
- **Cards plates** sur background tinté, sans border lourde, radius 8-12px, padding 24-32px.
- **Pas de gradient, pas d'ombre marquée, pas de border-radius > 16px.**
- **Densité = pédagogie** : préférer empiler verticalement avec respiration plutôt que de juxtaposer en grille dense. Une vue qui scrolle un peu vaut mieux qu'une vue qui suffoque.
- **Chiffres et données structurantes en display type** — c'est notre cœur de métier (indicateurs, collections).

### 3.3 Anti-patterns à proscrire

- Bandeau de couleur pleine largeur en header.
- Tableaux denses sans alternance de fond ni respiration verticale.
- Plus de 2 couleurs d'accent simultanées.
- Icônes mixées (filled + outline, plusieurs styles).
- CTA avec gradient, shadow profonde, ou radius pill (>20px).
- Photographies stock institutionnelles.
- Sidebars à fond coloré saturé.

---

## 4. Ce qu'il faut produire ensuite

- [ ] Choisir entre les options de §3.1 (palette, typeface, bloc-marque).
- [ ] Mettre à jour `index.css` avec la palette définitive (Bleu République ou conservation slate).
- [ ] Choisir et installer la fonte (Marianne via fichiers locaux ou Inter via fontsource).
- [ ] Définir un set d'icônes unique (recommandation : Lucide React).
- [ ] Cataloguer les primitives UI à construire : Button, Card, Eyebrow, StatBlock, IconTile, PageHeader.
- [ ] Valider sur une vue réelle (probablement la home dashboard) le rendu d'ensemble avant de propager.
