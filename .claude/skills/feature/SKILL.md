---
name: feature
description: Workflow complet pour réaliser une feature avec tests e2e, PR GitHub et mise à jour Jira/Confluence
disable-model-invocation: false
argument-hint: [ticket-jira]
---

# Workflow Feature

Tu réalises une feature complète en suivant ce flow étape par étape. **Arrête-toi à chaque étape pour valider avec l'utilisateur avant de passer à la suivante.**

L'utilisateur fournit un identifiant de ticket Jira (ex: PIL-1249) en argument, ou tu lui demandes.

## Étape 1 — Récupérer le ticket Jira

- Lis le ticket Jira via le MCP Atlassian (`mcp__atlassian__getJiraIssue`)
- Affiche un résumé : titre, description, spécifications, assigné
- Demande confirmation à l'utilisateur avant de continuer

## Étape 2 — Implémenter la fonctionnalité

- Explore le code concerné pour comprendre l'architecture
- Implémente la feature en suivant les conventions du projet (CLAUDE.md)
- Utilise les patterns existants (domain-driven, CQRS, repository)
- **Ne commit pas encore**

## Étape 3 — Mettre à jour la couverture e2e

- Lis `docs/tests-e2e-couverture.md` pour comprendre le format existant
- Propose les cas de tests à ajouter pour cette feature
- Ajoute la section dans le fichier avec le bon numéro de section (`## N.`)
- Utilise le format `-` pour les bullets (pas `*`)
- Mets à jour la matrice profils × tests en bas du fichier
- **Discute avec l'utilisateur des cas de tests avant de coder**

## Étape 4 — Créer les tests e2e

- Suis le pattern Page Object Model décrit dans `docs/architecture/decisions/0005-tests-e2e.md`
- Crée le Page Object dans `tests/pages/`
- Crée le fichier de test dans `tests/`
- Ajoute le cleanup dans `tests/e2e-test-context.ts` si le test modifie des données
- Utilise les fixtures de `tests/fixtures.ts` et `AppActions` pour la connexion
- **Demande à l'utilisateur de lancer les tests**

## Étape 5 — Générer le gif de démonstration

- Lance le test e2e avec `E2E_VIDEO=on` pour capturer la vidéo
- Convertis la vidéo en gif ralenti (vitesse /2) avec ffmpeg :
  ```
  ffmpeg -i video.webm -vf "setpts=2*PTS,fps=10,scale=800:-1:flags=lanczos" -y tests/assets/<nom>.gif
  ```

## Étape 6 — Review du code

- Lance `npm run lint` avant toute chose (obligatoire)
- Propose à l'utilisateur de lancer une review avec `/review` ou `claude-code review` pour vérifier la qualité du code
- Corrige les éventuels retours de la review
- **Attends la validation de l'utilisateur avant de commit**

## Étape 7 — Commit, push et PR

- Ne mets pas de Co-Authored-By dans les commits
- Commit les changements avec un message descriptif
- Push la branche
- Construis le permalink du gif avec le SHA du commit : `https://raw.githubusercontent.com/<owner>/<repo>/<commit-sha>/tests/assets/<nom>.gif` (récupère owner/repo via `gh repo view --json nameWithOwner -q .nameWithOwner` et le SHA via `git rev-parse HEAD`)
- Crée ou mets à jour la PR GitHub avec :
  - Lien vers le ticket Jira
  - Description des changements
  - Gif de démonstration via le permalink (pas de drag & drop, utilise la syntaxe markdown `![demo](permalink)`)
  - Détail des tests e2e (contenu de `docs/tests-e2e-couverture.md` pour cette feature)

## Étape 8 — Mettre à jour Jira

- Ajoute un commentaire sur le ticket Jira avec :
  - Lien vers la PR
  - Gif de démonstration via le même permalink (syntaxe markdown `![demo](permalink)` — Jira supporte le markdown, ne PAS utiliser la syntaxe wiki `!url!`)
  - Description des changements
  - Critères d'acceptation (checklist)
  - Résumé des tests e2e ajoutés
- **Ne mets PAS à jour Confluence** (l'utilisateur le fait manuellement pour gérer les accordions)