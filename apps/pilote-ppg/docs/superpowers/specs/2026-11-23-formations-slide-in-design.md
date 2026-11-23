# Slide-in des formations Campus PILOTE sur l'accueil (PR 4)

Date : 2026-11-23
Ticket : [PIL-1923](https://data-ditp.atlassian.net/browse/PIL-1923), épic [PIL-1961](https://data-ditp.atlassian.net/browse/PIL-1961)
Suivi : [2026-11-18-formations-rdv-sp-suivi-pr.md](../plans/2026-11-18-formations-rdv-sp-suivi-pr.md)
Tables : [2026-11-18-formations-rdv-sp-tables-design.md](./2026-11-18-formations-rdv-sp-tables-design.md)
Maquettes : canevas Design privé https://claude.ai/artifact/47yE89CTBB4s8rAREx1pPB, variante D

## Intention

La DITP veut que les utilisateurs suivent les formations Campus PILOTE adaptées à leur profil. Pendant une période d'information, l'accueil leur présente ces formations dans un panneau qui glisse depuis le bas à droite (slide-in), avec un lien d'inscription vers Rendez-vous Service Public (RDV-SP) pour chaque séance.

Les PR 1 à 3 sont mergées dans `dev` : tables, paramétrage DITP (profils, périodes d'information) et synchronisation des motifs et séances par copilot. Cette PR part de `dev`, hors pile.

## Objectifs

- Présenter, sur l'accueil, les formations de la période en cours qui correspondent au profil de l'utilisateur et ont au moins une séance ouverte.
- Laisser l'utilisateur reporter la proposition (« Plus tard ») ou la refuser pour la période (« Ne plus me les proposer »).
- Garder l'état par utilisateur et par période dans `formation_periode_information_utilisateur`, sans nouvelle colonne.

## Non-objectifs

- Mesure d'usage dans Matomo : PR 5.
- Languette ou bouton pour rouvrir la slide-in après « Plus tard » : écartée par Tristan le 2026-11-23.
- Message dans la slide-in après un clic sur « S'inscrire » : écarté le 2026-11-23.
- Affichage des animateurs : retiré de la variante D à la demande de Tristan.
- Toute modification de l'admin des formations ou de la synchronisation copilot.
- Présentation ailleurs que sur l'accueil.

## Anti-objectifs

- La slide-in ne doit pas ralentir l'accueil : son chargement ne passe pas par le `getServerSideProps` de l'accueil.
- Elle ne doit pas se superposer aux trois modales de l'accueil (vidéo, service, infolettre) ni à l'assistant ouvert, et sur écran large elle ne masque pas la pastille de l'assistant.
- Elle ne doit pas apparaître dans les autres tests e2e de l'accueil.

## Règles (validées avec Tristan le 2026-11-23)

### Formations proposées

1. Période retenue : non supprimée (`deleted_at IS NULL`) et en cours selon `statutPeriode` (jour UTC, comme l'admin). Si plusieurs sont en cours, la plus récemment créée (`created_at`).
2. Formations : motifs de la période, non retirés de RDV-SP (`formation_motif.deleted_at IS NULL`), associés au profil de l'utilisateur (`formation_motif_profil.profil_code` = profil de la session).
3. Séances : celles de ces motifs qui sont ouvertes, c'est-à-dire pas commencées (`date_debut` > maintenant) et de statut `OUVERTE` selon `statutSeance` (ni annulée, ni complète).
4. Une formation sans séance ouverte n'est pas proposée.
5. Aucune formation à proposer : pas de slide-in et aucune ligne d'état créée, pour que la période reste « jamais présentée » si une séance s'ouvre plus tard.

### Présentation

| État de la ligne (utilisateur, période)                   | Slide-in présentée ?              |
| --------------------------------------------------------- | --------------------------------- |
| Pas de ligne                                              | Oui                               |
| `date_fermeture` renseignée                               | Non, pour toute la période        |
| `date_report` renseignée, il y a moins de 7 jours         | Non                               |
| `date_report` renseignée, il y a 7 jours ou plus          | Oui                               |
| Ligne sans report ni fermeture (présentée, aucune action) | Oui, à chaque visite de l'accueil |

- Le délai de 7 jours court depuis le dernier report (`date_report` est remplacée à chaque « Plus tard »). Choix de Tristan, contre « prochaine connexion » (sessions de 30 jours par défaut) et « prochaine visite » (report sans effet).
- Une nouvelle période est une nouvelle campagne : pas de ligne, donc la slide-in revient, même pour qui avait fermé la précédente. Modifier une période garde la même campagne (décidé en PR 2).

### Actions

| Action                             | Effet sur la slide-in affichée                       | Effet en base                                                           |
| ---------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| Première apparition à l'écran      | –                                                    | Ligne créée avec `date_presentation` = maintenant, si elle n'existe pas |
| « Plus tard », croix, touche Échap | Se ferme                                             | `date_report` = maintenant                                              |
| « Ne plus me les proposer »        | Se ferme                                             | `date_fermeture` = maintenant                                           |
| « S'inscrire » ou une autre date   | Reste ouverte ; RDV-SP s'ouvre dans un nouvel onglet | Aucun                                                                   |

- « S'inscrire » n'écrit rien (décision de Tristan) : l'utilisateur revient sur PILOTE, retrouve la slide-in et choisit alors « Plus tard » ou « Ne plus me les proposer ». S'il quitte la page sans choisir, la slide-in revient à sa prochaine visite de l'accueil.
- La croix et Échap valent « Plus tard » (proposition retenue sur le canevas).
- Un report ou une fermeture sans ligne existante (première présentation non enregistrée) crée la ligne avec `date_presentation` = maintenant.

## Approches envisagées

1. **Requête tRPC côté client (retenue par Tristan).** L'accueil appelle une requête du routeur `formation`, ouverte à tout utilisateur connecté, qui renvoie les formations à proposer ou rien. Le `getServerSideProps` de l'accueil, déjà lourd et rejoué à chaque changement de filtre, ne bouge pas ; tout reste dans le module `formations`. Coût : une requête après le chargement, sans gêne pour un panneau qui arrive après les modales.
2. **Comme les modales de l'accueil.** Le `getServerSideProps` de l'accueil appelle la requête et passe les formations en props, comme la vidéo et l'infolettre. Suit le précédent et rend tout dès le premier affichage, mais ajoute une requête à chaque chargement et à chaque filtre, et fait transiter des données de formations par l'accueil.
3. **File d'annonces générique** remplaçant l'enchaînement des modales. Écartée : un chantier en soi pour un seul nouvel élément.

## Construction

### Serveur (module `src/server/formations`)

- **Domaine** : une fonction pure qui, à partir de la ligne d'état (ou de son absence) et de `maintenant`, dit si la slide-in doit être présentée, avec le délai de 7 jours en constante. Testée en unitaire.
- **Requête** : à partir de l'utilisateur, de son profil et de `maintenant`, renvoie `null` (rien à présenter) ou la période et ses formations. Elle choisit la période, filtre motifs et séances selon les règles, lit la ligne d'état et applique la fonction du domaine. Formations triées par date de leur prochaine séance, séances par date. Chaque séance porte sa date de début, sa durée en minutes, son lien d'inscription et le nombre de places restantes (`nombre_places_max - nombre_inscrits`, `null` sans maximum). Testée en intégration.
- **Commandes** : marquer la présentation, reporter, fermer. Chacune prend l'utilisateur de la session et l'identifiant de la période, et fait un upsert sur (`utilisateur_id`, `periode_id`). Testées en intégration.
- **Routeur `formation`** : une requête (`slideIn`) et une mutation (`recordSlideInAction`, avec une action PRESENTATION, REPORT ou FERMETURE) en `protectedProcedure`, sans `checkAdminPermission`, avec le contrôle CSRF des mutations existantes. L'utilisateur et le profil viennent de `ctx.session`, jamais de l'entrée.

### Client

- Un composant de slide-in rendu par `BasePageAccueilLayout`, affiché seulement quand la requête renvoie des formations, que les trois modales sont fermées et que l'assistant n'est pas ouvert (ni fenêtre flottante, ni panneau latéral ; état lu depuis le contexte de l'assistant). Si l'utilisateur ouvre l'assistant pendant que la slide-in est affichée, elle se masque sans rien écrire et réapparaît à la fermeture de l'assistant.
- La mutation de présentation part quand la slide-in apparaît réellement à l'écran, une seule fois par chargement de l'accueil.
- Contenu (variante D du canevas) :
  - en-tête « CAMPUS PILOTE », titre « N formations pour votre profil » (« 1 formation pour votre profil » au singulier), ligne « Inscription sur Rendez-vous Service Public. », croix ;
  - une ligne par formation : nom, prochaine séance avec une icône d'horloge au format « Mar. 24 nov., 14 h · 45 min » (heure du fuseau du navigateur, comme le reste de l'application : un utilisateur des DROM voit son heure locale ; durée « 1 h 30 » au-delà d'une heure, pas d'heure de fin), mention « Plus que N places » quand il en reste 5 ou moins, bouton-lien « S'inscrire » vers la prochaine séance ;
  - bouton « N autres dates » qui déplie les autres séances, chacune en lien avec sa propre mention de places ;
  - pied : bouton « Plus tard » et lien-bouton « Ne plus me les proposer ».
- Nom affiché : le nom du motif sans son préfixe de campagne, c'est-à-dire la partie après le premier « : » (« CAMPUS PILOTE : Introduction à l'outil » devient « Introduction à l'outil », « CAP sur PILOTE : Devenir un coordinateur efficace » devient « Devenir un coordinateur efficace ») ; le nom entier s'il n'y a pas de « : ».
- Liens vers RDV-SP : `target="_blank"`, `rel="noopener"`, avec l'indication d'ouverture dans une nouvelle fenêtre prévue par le DSFR.
- Position sur écran large : en bas à droite, au-dessus de la pastille de l'assistant (`fixed bottom-6 right-6`) quand elle est affichée, à sa place sinon. Hauteur limitée à la fenêtre, la liste défile si besoin.
- Position sur mobile : feuille pleine largeur collée en bas d'écran, cibles de 44 px. Elle recouvre la pastille de l'assistant, qui redevient accessible dès que la feuille est fermée ; on ne touche pas au code de l'assistant. Pas de voile sur la page : l'artboard « Mobile » du canevas, antérieur à la variante D, en montrait un, ainsi qu'une ancienne mise en page ; seul le contenu de la variante D fait foi.
- Accessibilité : panneau non modal, titré par son en-tête ; il ne prend pas le focus à l'apparition ; Échap le reporte quand le focus est dedans.
- En cas d'échec d'une mutation, la slide-in se ferme quand même et l'erreur est journalisée (pas de toast) : l'utilisateur la reverra simplement à la prochaine visite.

### Données de test

- Seed local (`seed-formations.ts`) : inchangé, il crée déjà une période en cours, des séances de tous statuts et aucune ligne d'état.
- E2E : les données de formations d'un scénario de slide-in ne doivent pas faire apparaître la slide-in dans les autres tests de l'accueil.

### Tests attendus

- Unitaires : la fonction de présentation (pas de ligne, fermeture, report de moins et de plus de 7 jours, ligne sans action).
- Intégration : la requête (choix de la période, période supprimée ou à venir, profil, motif retiré, séances annulées, complètes ou passées, formation sans séance ouverte, état de la ligne) ; les trois commandes (création et mise à jour de la ligne).
- E2E : un scénario sur l'accueil (affichage, « Plus tard », plus d'affichage à la visite suivante).

## Choix faits pendant la rédaction, à confirmer par Tristan

- La slide-in attend que l'assistant soit fermé, comme elle attend les modales, et se masque s'il s'ouvre.
- Sur mobile, la feuille recouvre la pastille de l'assistant, sans voile.
- Nom affiché sans le préfixe de campagne (partie après le premier « : »).
- Pas de prise de focus à l'apparition.
- Échec d'une mutation : la slide-in se ferme quand même, erreur journalisée, pas de toast.

## Laissé à la construction

- Noms des fichiers, classes, procédures tRPC et composants, en suivant les conventions du module (métier en français, technique en anglais).
- Forme exacte de la réponse de la requête.
- Fonctions de formatage des dates et durées : réutiliser l'existant du client s'il convient.
- Animation d'entrée et de sortie.
- Façon d'isoler les données e2e (création dans le scénario ou utilisateur et profil dédiés).
