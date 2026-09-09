# ProConnect sur PILOTE PPG — design

Épique [PIL-1737](https://data-ditp.atlassian.net/browse/PIL-1737).
US [PIL-1742](https://data-ditp.atlassian.net/browse/PIL-1742) (connexion ProConnect),
[PIL-1743](https://data-ditp.atlassian.net/browse/PIL-1743) (non-régression Keycloak),
[PIL-1744](https://data-ditp.atlassian.net/browse/PIL-1744) (écran de choix).

## Objectif

Permettre à un utilisateur disposant d'un compte PILOTE PPG actif de s'authentifier via
ProConnect **ou** via le parcours Keycloak existant, sans duplication de compte ni
modification de ses habilitations.

Keycloak n'est pas décommissionné. Les comptes continuent d'être créés dans Keycloak par
PPG. ProConnect s'ajoute au moment du login, rien d'autre.

## État des lieux

### PPG

`apps/pilote-ppg` — Next.js 16 (pages router) + next-auth `5.0.0-beta.32`, un seul provider
Keycloak.

- `src/server/infrastructure/api/auth/[...nextauth].tsx` — stratégie **JWT**, sans adapter et
  sans table next-auth. Toute la session vit dans le cookie chiffré, rien n'est persisté
  côté serveur.
- `src/proxy.ts` — middleware Next. Sur chaque route non publique, **introspection Keycloak**
  du `token.accessToken`. C'est aujourd'hui le seul point qui applique la désactivation d'un
  compte côté PPG.
- Modèle `utilisateur` — `email @unique`, pas de booléen d'activité : `date_desactivation`
  fait foi (`statut: dateDesactivation ? "desactive" : "actif"` dans tout le code).
- Trois `signIn("keycloak")` en dur : `BoutonSeConnecter.tsx`, `PageLanding.tsx`. Il n'existe
  aucune page de connexion.

### kpilote (référence)

`apps/kpilote-webapp` a déjà ProConnect × Keycloak, mais **sans next-auth** : BFF Hono +
`openid-client`. Non réutilisable tel quel, mais trois enseignements le sont :

- **Le `userinfo` ProConnect renvoie un JWT signé, pas du JSON** — `kpilote-api/src/authentication/jwks.ts:39`
  fait `.text()` puis `jwtVerify`.
- **L'access token ProConnect est opaque**, pas un JWT — c'est ce que discrimine `isJwt()`.
- **Le refresh token ProConnect est plafonné à 2 h en dur, sans rotation et sans
  `refresh_expires_in`** — constaté empiriquement, cf. commentaire sourcé dans
  `kpilote-webapp/src/server/auth/router.ts:27` et PIL-1637.

### Ce qui n'existe pas

- Auth.js ne livre **aucun** provider ProConnect, AgentConnect ou FranceConnect. Provider
  OIDC custom à écrire.
- Pas de `@codegouvfr/react-dsfr`, seulement `@gouvfr/dsfr` en CSS brut : le bouton officiel
  ProConnect (charte DINUM obligatoire) est à intégrer depuis le kit fourni.

## Décisions

| Sujet | Décision |
|---|---|
| Architecture | Provider OIDC ProConnect ajouté à côté de Keycloak dans `[...nextauth].tsx` |
| Session | Autonome, 30 j, identique pour les deux providers — pas de refresh ProConnect |
| Contrôle d'accès continu | `date_desactivation` en base pour les deux providers ; introspection Keycloak supprimée |
| Rapprochement | Email normalisé à chaque login, rien de persisté |
| Logout ProConnect | Local seulement (pas de `end_session`) |
| Mesure | Colonne nullable `dernier_provider_connexion` |
| `DEV_PASSWORD` | Inchangé, continue de remplacer entièrement OIDC |
| ProConnect en local | Obligatoire (hors mode `DEV_PASSWORD`) |

### Justification des deux moins évidentes

**Session autonome plutôt qu'alignée sur l'IdP.** Le plafond ProConnect de 2 h non
renouvelable imposerait une re-authentification toutes les 2 h, contre 30 j en Keycloak, sur
une application où les gens saisissent des données. L'asymétrie était inacceptable. On acte
donc que **l'IdP authentifie au moment du login et rien de plus** : ensuite la session PPG
vit sa vie, et le contrôle d'accès continu devient un contrôle PPG.

**Suppression de l'introspection Keycloak.** Conséquence de la précédente. Une fois écrit le
contrôle « ce compte est-il actif en base » nécessaire à ProConnect, le maintenir *en plus*
de l'introspection pour Keycloak seul laisse deux sémantiques de session à maintenir pour un
gain marginal. On perd la détection d'une révocation opérée directement dans Keycloak (console
admin, SSO logout depuis une autre app du realm) ; en pratique la désactivation passe toujours
par PPG, qui écrit dans les deux. **Cette décision touche au parcours Keycloak alors que
PIL-1743 demande qu'il soit inchangé — à défendre en refinement et à couvrir en non-régression.**

## Architecture

```
                     ┌──────────────────────────────┐
  « Se connecter » → │  /connexion                  │
                     │  ┌────────────────────────┐  │
                     │  │ S'identifier avec      │──┼──→ ProConnect
                     │  │ ProConnect  (si FF on) │  │
                     │  ├────────────────────────┤  │
                     │  │ Adresse électronique   │──┼──→ Keycloak
                     │  │ et mot de passe        │  │
                     │  └────────────────────────┘  │
                     │  [bandeau d'erreur éventuel] │
                     └──────────────────────────────┘
                                   │
                                   ▼
                        callback signIn (ProConnect)
                     email → utilisateur PPG actif ?
                        non → retour /connexion + motif
                        oui ↓
                        callback jwt
                     date_derniere_connexion + provider
                                   │
                                   ▼
                     session JWT, 30 j, cookie chiffré
                                   │
                    chaque requête ▼
                        proxy.ts : compte actif ?
                     non → purge cookies + /connexion
```

## Composants

### 1. Provider ProConnect

`OAuthConfig` custom dans `[...nextauth].tsx`, à côté de `keycloak`.

- Scopes `openid given_name usual_name email`. **`usual_name`, pas `family_name`** — ProConnect
  ne suit pas la nomenclature OIDC courante.
- **`userinfo.request` custom obligatoire** : l'endpoint renvoie `application/jwt`, Auth.js
  attend du JSON. Il faut récupérer le JWT et le décoder. C'est le point qui demandera le plus
  de tâtonnement de tout le lot ; à traiter en premier pour lever le risque.
- Vérifier à l'implémentation la méthode d'authentification au token endpoint
  (`client_secret_post` chez ProConnect, `client_secret_basic` par défaut chez Auth.js) et
  l'algorithme de signature de l'`id_token`.
- Bloc `proconnect` dans convict sur le modèle du bloc `keycloak` ; identifiants d'intégration
  dans `.env.example`, comme kpilote qui a committé ceux de `fca.integ01.dev-agentconnect.fr`.

```
providers: !!configuration().devPassword
  ? [credentialsProvider]
  : [keycloak, proconnect]
```

### 2. Le refus, dans `signIn`

C'est le correctif central. Le callback `session` fait aujourd'hui `utilisateur!.profil`
(ligne 362) et `utilisateur!.id` (ligne 373) — des assertions non-null qui disparaissent à la
compilation, alors que `récupérer()` renvoie `Utilisateur | null` et que la ligne 365 traite
la même variable comme nullable. L'invariant qui rend ça sûr aujourd'hui — tout compte
Keycloak a été créé par PPG, donc il est en base — **est cassé par ProConnect**, où n'importe
quel agent de l'État atteint ce code. Sans garde en amont : `TypeError` dans un callback
next-auth, donc 500 sur toute page.

On ne corrige pas les `!` (hors périmètre) ; on garantit qu'on n'arrive jamais là avec un
inconnu, via un callback `signIn` qui ne s'applique qu'à ProConnect :

| Cas | Motif |
|---|---|
| `email` absent ou vide dans les claims | `email_absent` |
| aucun utilisateur PPG pour cet email | `compte_inconnu` |
| `date_desactivation` non nulle | `compte_desactive` |

Normalisation `.trim().toLowerCase()`, cohérente avec le repository qui fait déjà
`toLowerCase()`. Keycloak passe sans contrôle : `return true` immédiat.

Un refus se traduit par un retour sur `/connexion` avec le motif, jamais par une erreur
technique.

### 3. `proxy.ts` — contrôle d'accès continu

L'appel HTTP d'introspection est remplacé par un contrôle en base, pour les deux providers.
Faisable parce que le `proxy.ts` de Next 16 tourne **obligatoirement** en runtime Node
(l'Edge n'y est plus possible, et y déclarer `runtime` lève une erreur au build).

- Passer par le container via `await import("@/server/dependances")`, comme le fait déjà
  `[...nextauth].tsx` — import dynamique et non statique, pour que le chunk du middleware
  n'embarque pas les 31 modules.
- **Ne pas utiliser le repository `legacy`** : son `récupérer()` déclenche
  `_récupérerTerritoires()`, `_récupérerChantiers()` et `_récupérerPérimètresMinistériels()`
  avant toute chose. Ajouter une méthode `estActif(email)` côté `gestionUtilisateur`, à côté
  de `verifierExistenceUtilisateur` qui a déjà la bonne forme mais ne filtre pas
  `date_desactivation` et ne normalise pas l'email.
- La redirection emporte désormais le chemin demandé — `/connexion?redirect=<path>` — pour
  satisfaire « l'utilisateur retrouve la page initialement demandée » (PIL-1744). **Validation
  stricte du chemin** (interne, pas de `//`, longueur bornée), sur le modèle du
  `safeRedirectPath` de kpilote : sans ça on ouvre une faille d'open redirect.

**Le bloc de purge des cookies doit conserver le fix de `a6c8a2f4d`.** Un cookie nommé
`__Secure-…` n'est accepté ni à la pose ni à l'effacement s'il ne porte pas l'attribut
`Secure` ; next-auth nomme le sien `__Secure-authjs.session-token` dès que `NEXTAUTH_URL` est
en https. L'ancien code effaçait avec `secure: NODE_ENV === "production"`, donc sans `Secure`
sur un environnement https non-production (review app, staging, https local) : le navigateur
rejetait le clear, le cookie survivait, et on partait en boucle de redirections.

Ce chemin devient **beaucoup plus emprunté** : aujourd'hui la purge ne part que si
l'introspection Keycloak échoue, c'est-à-dire quasiment jamais ; demain elle part à chaque
fois qu'un compte désactivé se présente, ce qui est une opération d'admin de routine. Une
purge cassée ne serait plus un cas rare mais le comportement nominal de la désactivation. **À
tester en https, pas seulement en local http.**

### 4. Session, refresh, logout

`_hasExpired` doit retourner `false` pour `proconnect` comme il le fait déjà pour
`credentials`. Sans ça, le premier appel à `refreshAccessToken` — câblé en dur sur
`provider == keycloak.id`, avec un `else` qui renvoie `RefreshAccessTokenError` — ferait
retourner `null` au callback `jwt` et tuerait la session.

On ne conserve pas le refresh token ProConnect : il ne sert à rien puisqu'on ne rafraîchit
pas.

`doFinalSignoutHandshake` reste inchangé pour Keycloak et ne fait rien pour ProConnect : on
détruit la session PPG sans toucher à la session ProConnect. L'utilisateur reste connecté à
ProConnect et à ses autres services de l'État — c'est le comportement attendu d'un « se
déconnecter » sur une application métier. **Effet de bord à documenter côté produit** : la
reconnexion suivante sera instantanée, sans re-saisie, ce qui peut surprendre voire inquiéter
sur un poste partagé.

### 5. Écran de choix et erreurs

Nouvelle page `/connexion`. Les trois `signIn("keycloak")` en dur pointent dessus.

**La page porte aussi les erreurs**, via `pages: { signIn, error }`. Une seule page satisfait
alors d'un coup « une annulation ou une erreur chez un fournisseur permet de revenir au choix
des modes de connexion » (PIL-1744) et « le refus affiche une explication compréhensible, le
contact d'assistance, un accès au parcours Keycloak » (PIL-1742) : le message s'affiche
au-dessus des deux boutons, dont celui de Keycloak.

Bouton officiel ProConnect à intégrer depuis le kit DINUM (charte obligatoire, pas un bouton
DSFR maison). Second bouton « Se connecter avec une adresse électronique et un mot de passe »
→ `signIn("keycloak")`.

Le FF `NEXT_PUBLIC_FF_PROCONNECT` (table des variables de contenu, pattern existant) pilote
**l'affichage du bouton uniquement** — pas l'enregistrement du provider, qui se fait au
chargement du module alors que le FF est en base. Quand le FF est off, la page ne montre que
Keycloak et aucun bouton ProConnect inopérant n'est affiché.

### 6. Mesure

Colonne nullable `dernier_provider_connexion` sur `utilisateur`, écrite au même endroit et au
même moment que `date_derniere_connexion`, dans `mettreAJourDateDerniereConnexion` appelée
par le callback `jwt`. Donne la photo SQL du parc : qui est passé à ProConnect, qui est encore
sur Keycloak, croisable avec le profil et le périmètre ministériel.

L'écriture a lieu dans `jwt`, donc **après** le refus éventuel de `signIn` : une connexion
refusée ne laisse pas de trace de connexion.

## Cas limites

| Cas | Comportement attendu |
|---|---|
| Identité ProConnect inconnue de PPG | Refus `compte_inconnu`, retour `/connexion` — pas de 500 |
| Compte PPG désactivé | Refus `compte_desactive` |
| Claims ProConnect sans email exploitable | Refus `email_absent` |
| Email ProConnect ≠ email PPG | Refus (même chemin que `compte_inconnu`) |
| Casse ou espaces dans l'email | `.trim().toLowerCase()` des deux côtés |
| Connexions successives ProConnect puis Keycloak | Aucun doublon possible : pas de table de comptes, pas de création |
| Session expirée | Redirection vers `/connexion`, sans erreur technique |
| ProConnect indisponible ou annulation utilisateur | Retour `/connexion` avec message, Keycloak reste utilisable |
| ProConnect désactivé par FF | Parcours Keycloak intact, aucun bouton mort affiché |
| Désactivation d'un compte en cours de session | Éjection à la requête suivante, via `proxy.ts` |
| Compte désactivé + https | **Chemin critique** : purge des cookies, cf. fix `secure` |

## À remonter en refinement

**Le lien PPG → PMB force `provider=keycloak`.** La branche
`feat/mb-ppg-pmb-sso-auto-login` pose un cookie `pmb-ppg` et kpilote relance un flow OIDC en
Keycloak en dur (`main.tsx`). Un utilisateur connecté à PPG en ProConnect qui clique « Pilote
Marque Blanche » s'authentifierait une seconde fois, en Keycloak. Il faut propager le provider
dans le cookie. **Aucune des trois US ne le couvre.**

**Combien d'utilisateurs ne pourront jamais passer par ProConnect ?** Le rapprochement par
email refuse toute adresse qui ne correspond pas : compte créé avec une adresse personnelle,
de prestataire, ou une adresse ministérielle différente de celle que ProConnect renverra.
**Requête SQL à passer avant la mise en service** — si c'est une part significative du parc,
le message d'erreur et le parcours d'assistance deviennent un sujet à part entière.

**Changement d'email ProConnect.** Le rapprochement n'étant pas persisté, un agent qui change
de ministère perd l'accès jusqu'à correction manuelle par un admin. Assumé, à documenter pour
le support.

**Deux latences de prise d'effet de la désactivation.** Décision prise de supprimer
l'introspection ; il reste que la désactivation écrit dans PPG *et* dans Keycloak, et que
seul le contrôle PPG s'applique désormais. Une révocation opérée directement dans Keycloak
n'est plus détectée.

**Le contrôle du parcours Keycloak change** (§ Décisions) alors que PIL-1743 demande qu'il
soit inchangé.

## Tests

Les e2e actuels forgent un token via `NextAuthHelper` et court-circuitent l'authentification
grâce à `DEV_PASSWORD` : **ils ne couvrent aucun des cas ci-dessus.**

**Tests serveur** sur le callback `signIn` — c'est là que se joue l'essentiel, et ça évite de
mocker ProConnect en e2e :

- connexion ProConnect réussie sur un compte actif
- compte inconnu → refus
- compte désactivé → refus
- email absent ou vide → refus
- email avec casse et espaces → rapprochement réussi
- Keycloak → passe sans contrôle

**Tests serveur** sur `estActif` et sur la validation du `redirect` (chemins externes,
protocol-relative `//`, longueur).

**e2e** : écran de choix, non-régression du parcours Keycloak à travers cet écran (PIL-1743),
déconnexion pour les deux providers, FF ProConnect off.

**Vérifier qu'aucune fixture e2e n'a de `date_desactivation`**, sinon le nouveau `proxy.ts`
les éjectera.

## Prérequis hors code

- Application ProConnect d'**intégration** dédiée à PPG, avec les `redirect_uri` locales
  déclarées. Celles de kpilote ne conviennent pas.
- Application ProConnect de **production** pour PPG.
- Comptes de test ProConnect d'intégration pour l'équipe (ProConnect étant obligatoire en
  local hors mode `DEV_PASSWORD`).
- Démarches de contractualisation DINUM (listées dans l'épique, état à confirmer).

## Hors périmètre

- Décommissionnement de Keycloak.
- Création automatique d'utilisateurs ou attribution de droits depuis les données ProConnect
  (SIRET compris).
- Migration ou suppression des comptes Keycloak.
- Adoption d'un adapter next-auth et bascule en stratégie de session en base.
- Correction des assertions non-null du callback `session`.
