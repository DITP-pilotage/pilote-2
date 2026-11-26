# ppg — dimensions Matomo administrables

Date : 2026-11-23 · Ticket : PIL-1958 · Branche : `feat/PIL-1958-dimensions-matomo-ppg`

## Intention

La correspondance dimension → numéro Matomo de ppg vit dans `NEXT_PUBLIC_MATOMO_DIMENSIONS` : chaque
changement demande une modification de configuration et un redéploiement. Elle passe en base et se
modifie dans le panel administrateur, sur le modèle de kpilote (PR #2651), sans code partagé.

## Objectifs

- Modifier ou vider le numéro d'une dimension sans redéploiement.
- Ne changer aucun numéro existant : les rapports Matomo doivent rester continus.
- Garder les dimensions sur la première page vue et sur les événements de `/connexion`.

## Hors périmètre

- Ajout ou suppression de clés depuis le panel, libellé en base.
- Création des dimensions dans Matomo.
- `NEXT_PUBLIC_MATOMO_URL`, `NEXT_PUBLIC_MATOMO_SITE_ID` et les autres variables analytics.
- kpilote.

## Approches

- **A. Liste fixe (choix du user).** Les clés viennent de `ANALYTICS_DIMENSIONS` ; seul le numéro est en
  base. Aucune clé sans effet possible. Ajouter une dimension demande du code, ce qui est déjà le cas :
  il faut bien l'envoyer.
- **B. Clés libres, comme kpilote.** Permet de préparer une clé avant son code, mais une faute de frappe
  reste sans effet et sans alerte. Écartée.

Transport :

- **Lecture par le client au démarrage, envois retenus (retenu, comme kpilote).**
- Injection par `getServerSideProps` : à ajouter à chaque page, dont celles sans `loadBootstrap`
  (`/connexion`). Écartée.

## Conception

- **Table `analytics_dimension`** : `cle` (clé primaire), `slot` (entier, unique), `created_at`,
  `updated_at`. Une ligne = une dimension configurée. La migration insère les 9 valeurs actuelles :
  `profil_pilote` 1, `conversation_id` 2, `llm_call_id` 3, `proposition_id` 4, `proposition_mode` 5,
  `type_question` 6, `nombre_choix` 7, `position_choix` 8, `environnement` 9. `periode_information` et `formation`, arrivées
  avec PIL-1923, restent sans numéro tant qu'elles ne sont pas créées dans Matomo.
- **Module serveur `analytics`** et routeur tRPC :
  - lecture **publique** de la correspondance (rien de sensible, lue avant la connexion) ;
  - enregistrement d'un numéro ou retrait (numéro vide), réservé à DITP_ADMIN. Clé hors
    liste ou numéro hors 1–999 : refus. Numéro déjà pris : refus avec le nom de la dimension qui le
    porte, y compris en cas d'écriture concurrente.
  - La liste des clés doit être importable par le serveur : elle passe dans `src/shared`.
- **Client** : si l'analytics est actif, une requête tRPC dédiée (hors batch, pour ne pas attendre les
  requêtes lentes de la page) lit la correspondance. Le tracker retient ses envois jusqu'à la réponse,
  3 s au plus, et les libère si la page se ferme ou passe en arrière-plan. En échec, ils partent sans
  dimensions, comme aujourd'hui. L'URL de la page est capturée à l'appel, pas à l'envoi : une
  navigation pendant l'attente ne doit pas fausser l'événement.
- **Panel** : page `/panel-administrateur/dimensions-matomo`, entrée « Dimensions Matomo » du menu.
  Tableau des dimensions du code (clé, n° ou « Non configurée », Modifier) ; modale avec le numéro, vide pour
  retirer. Rappel : créer d'abord la dimension dans Matomo, en portée « Action » si le contexte change
  d'une page à l'autre ; pour échanger deux numéros, vider l'un d'abord. Garde DITP_ADMIN en
  `getServerSideProps`. Un changement s'applique au prochain chargement complet de page.
- **Retrait** de `NEXT_PUBLIC_MATOMO_DIMENSIONS` : `config.ts`, `.env.example`, `parseDimensionSlots`.
  Après le déploiement, à supprimer aussi des environnements Scalingo (action manuelle).

## Tests

- Unitaires : mise en attente puis envoi avec les dimensions, délai dépassé, fermeture de page, URL
  capturée à l'appel.
- Intégration : lecture, enregistrement, retrait, numéro pris, clé inconnue, numéro hors bornes.
- E2E : la page rejoint la liste des pages réservées de `gardes-panel-admin.spec.ts`, et la mutation
  est refusée à un non-administrateur.
- Pas de test de composant pour la page.

## Laissé au développeur

Nommage interne, découpage des fichiers, rendu exact du tableau (composants du panel Formations).
