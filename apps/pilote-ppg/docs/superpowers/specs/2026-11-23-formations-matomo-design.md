# Mesure d'usage de la slide-in des formations dans Matomo (PR 5)

Date : 2026-11-23
Ticket : [PIL-1923](https://data-ditp.atlassian.net/browse/PIL-1923), épic [PIL-1961](https://data-ditp.atlassian.net/browse/PIL-1961)
Suivi : [2026-11-18-formations-rdv-sp-suivi-pr.md](../plans/2026-11-18-formations-rdv-sp-suivi-pr.md)
Slide-in : [2026-11-23-formations-slide-in-design.md](./2026-11-23-formations-slide-in-design.md)
Socle Matomo de PILOTE : [2026-10-14-ppg-matomo-events-design.md](../../../../../docs/superpowers/specs/2026-10-14-ppg-matomo-events-design.md)

## Intention

Le ticket demande de mesurer l'usage de la slide-in, par période d'information : utilisateurs exposés, clics par formation, masquages (les « reports » du ticket, depuis que « Plus tard » a disparu) et fermetures, ainsi que la part des exposés qui cliquent vers une inscription. Un clic ne confirme pas une inscription effective.

La décision de la PR 1 tient : la ligne d'état en base ne garde que ce qu'il faut pour décider d'afficher, et toute la mesure d'usage passe par Matomo. Cette PR part de `dev` (PR 1 à 4 mergées).

## Objectifs

- Envoyer quatre événements depuis la slide-in : affichage, clic vers l'inscription, masquage, fermeture.
- Rattacher chaque événement à sa période d'information, et le clic à sa formation, par deux nouvelles dimensions Matomo.
- Garder le découpage par profil, déjà fourni par `profil_pilote`.

## Non-objectifs

- Part des exposés qui cliquent comptée en personnes : Matomo la donne en visites (voir « Limites »), ce qui suffit (décision de Tristan).
- `nombre_choix` et `position_choix` : écartées par Tristan, inutiles ici.
- Distinguer le clic sur la prochaine séance du clic sur une autre date, et suivre le dépliage des autres dates : le ticket ne le demande pas.
- Tout changement de comportement de la slide-in ou de la ligne d'état en base.

## Anti-objectifs

- La mesure ne doit jamais casser ni retarder la slide-in : un envoi qui échoue est ignoré, comme partout dans le socle.
- Pas d'identifiant d'utilisateur envoyé à Matomo.

## Approches envisagées

1. **Deux vraies dimensions Matomo, `periode_information` et `formation` (retenue par Tristan).** Les valeurs se filtrent, se segmentent et s'agrègent dans Matomo. Coût : créer deux dimensions côté Matomo, hors du dépôt (voir « Hors du dépôt »).
2. **Repli en suffixe du nom d'événement.** Le socle ajoute déjà toute dimension sans emplacement au nom (`inscription.click?formation=…&periode_information=…`). Rien à configurer, une ligne par combinaison dans le rapport des noms d'événements, mais ni filtre ni segment sur ces valeurs. Écartée en tant que cible ; elle reste le comportement tant que les emplacements ne sont pas renseignés.
3. **Premier clic enregistré en base** (colonne sur `formation_periode_information_utilisateur`) pour une part exacte en personnes. Écartée : elle revient sur la décision de la PR 1 et ajoute une écriture au clic, pour une précision dont la lecture n'a pas besoin.

## Construction

### Vocabulaire (`src/client/analytics/schema.ts`)

- Catégorie `formations`.
- Noms : `slide_in.view`, `slide_in.minimize`, `slide_in.close`, `inscription.click` (technique en anglais, métier en français, comme l'assistant).
- Actions existantes, avec le même sens que pour l'assistant : `view`, `minimize` (masqué, revient), `close` (fermé pour de bon), `select`.
- Dimensions, de portée Action :

| Dimension             | Valeur                                                       |
| --------------------- | ------------------------------------------------------------ |
| `periode_information` | Dates de la période, `AAAA-MM-JJ → AAAA-MM-JJ` (début → fin) |
| `formation`           | Nom complet du motif RDV-SP, tel qu'affiché dans la slide-in |

`profil_pilote` (portée Visite) est ajouté par `useAnalytics` à chaque événement, sans rien faire.

### Événements

| Moment                                        | Action     | Nom                 | Dimensions                         |
| --------------------------------------------- | ---------- | ------------------- | ---------------------------------- |
| Slide-in réellement affichée                  | `view`     | `slide_in.view`     | `periode_information`              |
| Clic sur « S'inscrire » ou sur une autre date | `select`   | `inscription.click` | `periode_information`, `formation` |
| Croix ou Échap                                | `minimize` | `slide_in.minimize` | `periode_information`              |
| « Ne plus me les proposer »                   | `close`    | `slide_in.close`    | `periode_information`              |

- L'affichage part au même moment que la mutation `PRESENTATION` : une fois par chargement de l'accueil, quand la slide-in apparaît vraiment (modales et assistant fermés).
- Le clic se mesure au clic sur le lien. Un clic du milieu ou « Ouvrir dans un nouvel onglet » du menu contextuel n'est pas compté.

### Serveur

`GetFormationsAProposerQuery` renvoie, en plus de l'identifiant, les dates de début et de fin de la période retenue (`AAAA-MM-JJ`). Le test d'intégration de la requête suit.

### Client

- Un hook de suivi de la slide-in, calqué sur `useAssistantTracking`, qui fixe la catégorie `formations`.
- `useSlideInFormations` envoie l'affichage, le masquage et la fermeture ; `LigneFormation` envoie le clic, depuis le bouton « S'inscrire » et depuis chaque lien des autres dates.
- Le libellé de la période est construit une fois à partir des dates renvoyées par le serveur.

### Configuration

- `.env.example` : `periode_information` et `formation` ajoutées à `NEXT_PUBLIC_MATOMO_DIMENSIONS`, avec des numéros d'exemple.

### Tests

- Intégration serveur : la requête renvoie les dates de la période.
- Pas de nouveau test client : la construction des événements est directe, et le socle teste déjà l'envoi des dimensions et le repli en suffixe (`buildRequest.unit.test.ts`).
- Pas d'e2e : `NEXT_PUBLIC_RECORD_ANALYTICS` est à `false` en e2e, aucun parcours ne change.
- Vérification à la main : en local, avec l'analytics activée et une URL Matomo factice pour ne rien envoyer au vrai serveur, lire les requêtes `matomo.php` émises pour chaque moment (catégorie, action, nom, dimensions en suffixe faute d'emplacements). En recette, contrôler les événements dans Matomo une fois les dimensions créées.

## Hors du dépôt

- Créer les deux dimensions, de portée Action, sur le site Matomo de PILOTE (`stats.beta.gouv.fr`, instance mutualisée), puis saisir leurs numéros dans `/panel-administrateur/dimensions-matomo` sur chaque environnement (PIL-1958).
- PILOTE utilise déjà sept dimensions de portée Action, au-delà des cinq prévues par défaut : vérifier qu'il reste deux emplacements, sinon les faire ajouter par l'administrateur de l'instance.
- À faire avant la mise en production : les événements envoyés sans emplacement restent en suffixe du nom dans Matomo et ne basculent pas après coup. Sans cela, la première campagne serait coupée en deux.

## Limites acceptées

- **Visites, pas personnes.** Matomo regroupe en visites les actions séparées de moins de 30 minutes, coupées à minuit, et reconnaît le visiteur à une empreinte (IP, navigateur, système, langue). La part des exposés qui cliquent se lit donc comme « visites avec clic / visites avec affichage ». Un agent qui revient plusieurs jours compte plusieurs visites exposées ; deux agents derrière la même sortie réseau avec le même navigateur, dans la même demi-heure, peuvent être confondus. Les exposés et les fermetures exacts par période restent lisibles en SQL dans `formation_periode_information_utilisateur`.
- **Do Not Track.** Les navigateurs qui l'activent n'envoient rien : Matomo comptera moins d'exposés que la base.
- **Mêmes dates, même période.** Deux périodes aux mêmes dates (une période qui en remplace une autre à l'identique) se confondent dans Matomo ; pour le lecteur, c'est la même campagne.
- **Motif renommé.** Un motif renommé dans RDV-SP coupe ses chiffres en deux lignes.

## Choix faits pendant la rédaction, à confirmer par Tristan

- Format du libellé de période : `2026-11-23 → 2027-01-01`.
- Clic mesuré au clic gauche (et Ctrl/Cmd + clic) sur le lien, pas au clic du milieu ni au menu contextuel.
- Pas de nouveau test client.
- Vérification locale avec une URL Matomo factice.

## Laissé à la construction

- Noms et emplacement du hook et des fonctions qui construisent les événements, en suivant le module (`SlideInFormations`).
- Forme exacte de la période dans la réponse de la requête.
- Numéros d'exemple dans `.env.example`.
