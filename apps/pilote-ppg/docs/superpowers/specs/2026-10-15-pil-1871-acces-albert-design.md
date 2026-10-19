# PIL-1871 — Accès à l'assistant IA (Albert) gérés en base depuis le panel admin

Ticket : https://data-ditp.atlassian.net/browse/PIL-1871 (epic PIL-1516 LLM)

## Contexte

L'accès à Albert est piloté par l'environnement :

- `ASK_AI_TERRITOIRE_EMAILS` (liste d'emails, cache process, `src/server/albert/emailsAutorisesAskAITerritoire.ts`), conditionnée par `NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE` ;
- un `NEXT_PUBLIC_FF_ASK_AI_<PROFIL>` par profil (`DITP_ADMIN`, `EQUIPE_DIR_PROJET`, `DITP_PILOTAGE`, `COORDINATEUR` = région + département), règle dans `src/server/albert/accesAskAI.ts`.

La règle est recalculée côté navigateur (`useAskAIAccess` via `useEnv`). Ajouter ou retirer un accès impose de modifier l'environnement et de redéployer.

Aujourd'hui `estEligibleTerritoire` (FF territoire + email listé) sert aussi à choisir les scénarios du bouton de synthèse (coordinateur vs DITP).

## Objectif

Gérer ces droits depuis le panel administrateur Albert, sans redéploiement, en base.

## Décisions

- Nouveau module serveur dédié `src/server/albert-access/` (pas d'extension du module `albert`, déjà chargé de l'agent LLM).
- Accès calculé côté serveur et transmis au client en prop ; plus aucun calcul côté navigateur.
- Scénarios choisis selon le **profil**, plus selon l'origine de l'accès : `DITP_ADMIN` et `DITP_PILOTAGE` → scénarios DITP ; tous les autres profils (dont `EQUIPE_DIR_PROJET`) → scénarios coordinateur. À vérifier en recette.
- Ajout d'un utilisateur via un picker de recherche (Radix Popover + `cmdk`), pattern repris de `packages/kpilote-ui/src/Picker.tsx` sans dépendre de kpilote (frontière ppg / kpilote).
- Nommage : technique en anglais, termes domaine (`profil`, `utilisateur`) en français.

## Modèle de données

Migration SQL écrite à la main dans `src/database/prisma/migrations/<timestamp>_albert_access/migration.sql`.

```prisma
model albert_access_profil {
  profil_code   String   @id
  profil        profil   @relation(fields: [profil_code], references: [code], onDelete: Cascade, onUpdate: Cascade)
  date_creation DateTime @default(now())

  @@schema("public")
}

model albert_access_utilisateur {
  utilisateur_id String      @id @db.Uuid
  utilisateur    utilisateur @relation(fields: [utilisateur_id], references: [id], onDelete: Cascade)
  date_creation  DateTime    @default(now())

  @@schema("public")
}
```

- Un profil est activé si sa ligne existe ; le toggle insère ou supprime la ligne.
- Les tables démarrent vides : pas de reprise automatique (valeurs différentes par environnement).

## Règle d'accès

Fonction pure du domaine `checkAlbertAccess` :

```
checkAlbertAccess({ killSwitch, profil, profilActive, utilisateurAutorise })
  → { peutUtiliser: boolean, scenarios: "ditp" | "coordinateur" }

peutUtiliser = killSwitch && (profil === DITP_ADMIN || profilActive || utilisateurAutorise)
scenarios    = profil ∈ { DITP_ADMIN, DITP_PILOTAGE } ? "ditp" : "coordinateur"
```

- `killSwitch` = `NEXT_PUBLIC_FF_ASK_AI`, conservé, lu via `recupererToutesLesVariablesContenuUseCase` (module `gestionContenu`, importé par `albertAccess`).
- `CheckAlbertAccessUseCase.execute({ utilisateurId, profil })` lit le kill switch puis `profilActive` / `utilisateurAutorise` en une requête repository. Pas de cache : effet immédiat.
- Consommateurs :
  - `src/pages/accueil/chantier/[territoireCode]/index.tsx` (`getServerSideProps`) : la prop `emailAutoriseAskAITerritoire` est remplacée par `accesAlbert: { peutUtiliser, scenarios }` ;
  - `src/app/api/albert/chat/route.ts` : 403 si `!peutUtiliser`.
- `BasePageAccueilLayout` lit `accesAlbert` directement ; `estDITPAdmin` (session) reste utilisé par `scenariosTerritoireDITP`.

## Module serveur `albert-access`

Structure calquée sur `src/server/parametrage-nouveautes/` :

- `module.ts` : `name: "albertAccess"`, `imports: ["framework", "gestionContenu"]` ; enregistré dans `src/server/dependances.ts` (`allModules` + `registerContainer`).
- `domain/checkAlbertAccess.ts` : règle pure ci-dessus.
- `domain/ports/AlbertAccessRepository.ts` :
  - `listProfils(): { code, nom, active }[]` (sans `DITP_ADMIN`)
  - `setProfilActive(profilCode, active)`
  - `listUtilisateurs(): { utilisateurId, email, nom, prenom, profilCode, profilNom, autoriseViaProfil }[]` (tri `date_creation` desc)
  - `searchUtilisateurs(query, limit): { utilisateurId, email, nom, prenom, profilCode, profilNom, dejaAjoute, autoriseViaProfil }[]` (chaque mot de la saisie doit apparaître dans l'email, le prénom ou le nom, `contains` insensible à la casse ; sans `DITP_ADMIN` ni compte désactivé)
  - `findUtilisateurProfil(utilisateurId): string | null`
  - `addUtilisateur(utilisateurId)` (upsert, idempotent) / `removeUtilisateur(utilisateurId)`
  - `getAccessFlags(utilisateurId, profil): { profilActive, utilisateurAutorise }`
- `infrastructure/adapters/PrismaAlbertAccessRepository.ts`.
- Use cases (`usecases/`) : `ListProfilsUseCase`, `SetProfilActiveUseCase` (refuse `DITP_ADMIN`), `ListUtilisateursUseCase`, `SearchUtilisateursUseCase`, `AddUtilisateurUseCase` (refuse utilisateur inconnu ou `DITP_ADMIN`), `RemoveUtilisateurUseCase`, `CheckAlbertAccessUseCase`.

## API tRPC `albertAccess`

`src/server/albert-access/infrastructure/trpc/albertAccess.ts`, ajouté à `src/server/app/trpc/appRouter.ts` et à `src/server/framework/trpc/categorieLogRouteurTRPC.ts`. Chaque procédure (`protectedProcedure`) vérifie `ctx.session.profil === DITP_ADMIN`, sinon `UnauthorizedError`.

| Procédure | Entrée | Sortie / effet |
|---|---|---|
| `listProfils` | — | `[{ code, nom, active }]` |
| `setProfilActive` | `{ profilCode, active }` | refuse `DITP_ADMIN` |
| `listUtilisateurs` | — | liste des autorisés individuellement |
| `searchUtilisateurs` | `{ query }` (min 3 caractères) | max 10 résultats, recherche sur email, prénom et nom |
| `addUtilisateur` | `{ utilisateurId }` | refuse inconnu ou `DITP_ADMIN` ; idempotent |
| `removeUtilisateur` | `{ utilisateurId }` | supprime la ligne |

## Interface

### `AlbertPanel`

Ajout de deux onglets aux côtés de Discussion / Dashboard : `?onglet=permissions-profils` (« Permissions profils ») et `?onglet=permissions-emails` (« Permissions emails »).

### Onglet « Permissions profils »

- `Notice` info : « Les administrateurs DITP ont toujours accès à l'assistant IA. »
- `Table` Profil / Accès ; un `Switch` par ligne (une ligne par profil réel, `COORDINATEUR_REGION` et `COORDINATEUR_DEPARTEMENT` distincts, sans `DITP_ADMIN`).
- Toggle → mutation, invalidation de `listProfils` et `listUtilisateurs` (la mention « via le profil » dépend des profils), toast sonner ; switch désactivé pendant la mutation.

### Onglet « Permissions emails »

- `SearchPicker` déclenché par « Ajouter un utilisateur… » : recherche par nom, prénom ou email à partir de 3 caractères, debounce 300 ms côté appelant ; résultat « Prénom Nom · email · profil » ; mention « Déjà autorisé via le profil X » (sélectionnable) ; « Déjà dans la liste » (désactivé) ; aucun résultat → « Aucun utilisateur Pilote ne correspond ». Sélection → `addUtilisateur`, fermeture, invalidation, toast.
- `Table` Nom / Email / Profil / action « Retirer » ; badge « Déjà autorisé via le profil X » si `autoriseViaProfil` ; état vide « Aucun utilisateur autorisé individuellement ». Retrait immédiat, sans modale.

### `shared/SearchPicker.tsx` (nouveau)

Ajout de la dépendance `cmdk` (^1.1.1, même version que kpilote) à `apps/pilote-ppg`.

```ts
type SearchPickerProps<T> = {
  items: T[]
  search: string
  onSearchChange: (search: string) => void
  onSelect: (item: T) => void
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  isItemDisabled?: (item: T) => boolean
  isLoading?: boolean
  triggerLabel: ReactNode
  searchPlaceholder?: string
  emptyLabel?: string
}
```

Radix `Popover` (Trigger bouton, Content en portail) + `Command` de `cmdk` avec `shouldFilter={false}` (filtrage fait par le serveur). Accessibilité combobox/listbox et navigation clavier fournies par `cmdk`. Style Tailwind avec les tokens ppg, pas de classes `fr-*`, pas de couleurs en dur.

## Nettoyage

- Supprimer `src/server/albert/emailsAutorisesAskAITerritoire.ts`, `src/server/albert/accesAskAI.ts` et son test, `src/client/components/PageAccueil/useAskAIAccess.ts`.
- `src/config.ts` : retirer `askAITerritoireEmails` et les 5 `NEXT_PUBLIC_FF_ASK_AI_{DITP_ADMIN,EQUIPE_DIR_PROJET,DITP_PILOTAGE,TERRITOIRE,COORDINATEUR}` ; garder `NEXT_PUBLIC_FF_ASK_AI`.
- `src/server/gestion-contenu/domain/VariableContenuDisponible.ts` : retirer les mêmes clés et entrées.
- `.env.e2e`, `.env.example` : retirer ces variables.
- Adapter `RecupererFeatureFlipsUseCase.unit.test.ts`.

## Tests

Pas de tests front.

- Unitaires `checkAlbertAccess` : kill switch off ; `DITP_ADMIN` sans ligne en base ; profil activé ; utilisateur autorisé ; ni l'un ni l'autre ; profil `null` ; scénarios (`DITP_ADMIN`, `DITP_PILOTAGE` → ditp ; `EQUIPE_DIR_PROJET`, coordinateurs → coordinateur).
- Unitaires use cases d'écriture : `SetProfilActiveUseCase` refuse `DITP_ADMIN` ; `AddUtilisateurUseCase` refuse inconnu et `DITP_ADMIN`.
- Intégration `PrismaAlbertAccessRepository` : activation / désactivation / liste des profils ; ajout / retrait / liste des utilisateurs avec `autoriseViaProfil` ; recherche insensible à la casse, sans `DITP_ADMIN`, limite ; idempotence de l'ajout ; cascade à la suppression d'un utilisateur ; `getAccessFlags`.
- E2E : pas de nouveau test ; vérifier que les e2e Albert existants ne dépendent pas des flags supprimés (tables vides → accès `DITP_ADMIN` seul).

## Recette

- `/panel-administrateur/albert?onglet=permissions-profils` : activer `COORDINATEUR_REGION` ; se connecter en coordinateur régional sur `/accueil/chantier/<code région>` → bouton Albert visible, scénarios coordinateur ; désactiver → bouton absent.
- `/panel-administrateur/albert?onglet=permissions-emails` : rechercher un utilisateur par une partie de son email, l'ajouter → accès sur `/accueil/chantier/<code>` ; le retirer → plus d'accès. Un `DITP_ADMIN` n'apparaît pas dans la recherche.
- Mention « Déjà autorisé via le profil X » : dans la recherche, et dans la liste après activation du profil.
- À vérifier : scénarios DITP seulement pour `DITP_ADMIN` et `DITP_PILOTAGE` ; `EQUIPE_DIR_PROJET` reçoit les scénarios coordinateur.
- `NEXT_PUBLIC_FF_ASK_AI=false` → plus personne n'a accès, `DITP_ADMIN` compris.

## Déploiement

Avant la mise en prod, sur chaque environnement :

1. Relever les valeurs Scalingo de `ASK_AI_TERRITOIRE_EMAILS` et des `NEXT_PUBLIC_FF_ASK_AI_*`.
2. Relever aussi les surcharges en base : quand `featureFlipAdmin` est actif, `RecupererToutesLesVariablesContenuUseCase` fait primer la table `gestion_contenu` sur l'environnement, et ces 5 flips disparaissent de `/panel-administrateur/feature-flipping` après la mise en prod. Requête : `SELECT nom_variable_contenu, valeur_variable_contenu FROM gestion_contenu WHERE nom_variable_contenu LIKE 'NEXT_PUBLIC_FF_ASK_AI_%';` (ou capture de la page feature-flipping avant mise en prod). La valeur effective est la valeur en base si elle existe, sinon celle de l'environnement.
3. Après la mise en prod, réactiver les accès à la main via l'interface, supprimer ces variables des environnements et les lignes orphelines `NEXT_PUBLIC_FF_ASK_AI_*` de `gestion_contenu`.

## Hors périmètre

- Retrait de la dépendance morte `react-select` (PR séparée).
