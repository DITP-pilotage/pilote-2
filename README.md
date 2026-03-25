# Documentation PILOTE — GitHub Pages

Cette branche `gh-pages` héberge la documentation statique du projet PILOTE, servie automatiquement via GitHub Pages.

## Contenu

| Page | Chemin | Description |
|------|--------|-------------|
| Documentation dbt | `docs/dbt/` | Documentation générée par dbt docs, décrivant les modèles de données et transformations |
| Page de maintenance | `docs/maintenance/` | Page affichée quand Scalingo est down, liée via la configuration de maintenance Scalingo |
| Suivi des déploiements | `docs/releases/` | Visualisation des commits entre les branches dev/preprod/prod via l'API GitHub |

## Accéder à la documentation

La documentation est accessible à l'adresse :

```
https://ditp-pilotage.github.io/pilote-2/
```

- Documentation dbt : https://ditp-pilotage.github.io/pilote-2/docs/dbt/
- Page de maintenance : https://ditp-pilotage.github.io/pilote-2/docs/maintenance/
- Suivi des déploiements : https://ditp-pilotage.github.io/pilote-2/docs/releases/

## Mettre à jour la documentation

### Prérequis

- Être sur la branche `gh-pages`
- Les fichiers statiques à publier doivent être placés dans le dossier `docs/`

### Flow de mise à jour

1. **Checkout** de la branche `gh-pages` :
   ```bash
   git checkout gh-pages
   ```

2. **Ajouter ou modifier** les fichiers dans `docs/` :
   - Pour la doc dbt : générer la doc via `dbt docs generate` puis copier les fichiers dans `docs/dbt/`
   - Pour une nouvelle page : créer un nouveau sous-dossier dans `docs/` avec un `index.html`

3. **Commit et push** :
   ```bash
   git add docs/
   git commit -m "Mise à jour de la documentation"
   git push origin gh-pages
   ```

4. GitHub Pages détecte le push et publie automatiquement le contenu du dossier `docs/`.

### Ajouter une nouvelle page de documentation

1. Créer un dossier dans `docs/` (ex : `docs/ma-nouvelle-doc/`)
2. Y placer un `index.html` (ou les fichiers statiques nécessaires)
3. Mettre à jour le tableau de contenu dans ce README
4. Commit et push sur `gh-pages`
5. La page sera accessible à `https://ditp-pilotage.github.io/pilote-2/docs/ma-nouvelle-doc/`

## Configuration GitHub Pages

La branche `gh-pages` est configurée pour servir le contenu depuis le dossier `docs/`. Cette configuration se gère dans **Settings > Pages** du dépôt GitHub.
