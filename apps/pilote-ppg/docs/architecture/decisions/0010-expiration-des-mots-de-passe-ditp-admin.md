# 10. Expiration des mots de passe des comptes DITP_ADMIN

Date : 2026-10-01

## Statut

Accepté

## Contexte

Les recommandations de l'ANSSI et de la CNIL sur les accès sensibles demandent
un renouvellement périodique des mots de passe des comptes à privilèges. Les
comptes de profil `DITP_ADMIN` doivent donc changer de mot de passe tous les
6 mois, être prévenus 30 jours, 7 jours et le jour de l'expiration, et ne pas
pouvoir réutiliser leur ancien mot de passe.

PILOTE ne stocke aucun mot de passe : ils vivent dans Keycloak (realm `DITP`),
et une partie des utilisateurs se connecte par ProConnect sans mot de passe
PILOTE. Les politiques de mot de passe de Keycloak (« Expire Password »,
« Not Recently Used ») s'appliquent à tout le realm et ne peuvent pas être
restreintes à un profil PILOTE.

Un mécanisme équivalent existe déjà pour la désactivation des comptes inactifs
(table `action_compte_inactif`, cron `desactivation-comptes`, exécuté par
API comme le décrit l'ADR 0006).

## Décision

- **Keycloak reste la seule source du mot de passe.** Il porte l'interdiction
  de réutilisation (politique « Not Recently Used » à 3, configurée à la main
  dans le realm) et la vérification du mot de passe.
- **Le cycle de 6 mois est piloté par PILOTE**, pour les seuls `DITP_ADMIN`,
  à partir de la table `suivi_password_admin`. La date du dernier changement y
  est copiée une fois par jour depuis la date de création du credential
  `password` lue par l'admin API Keycloak. Il n'y a pas de synchronisation à
  la connexion.
- **La date d'expiration est stockée**, pas recalculée : à l'initialisation
  d'un suivi, elle n'est jamais à moins de 30 jours, ce qui évite de forcer
  sans préavis les mots de passe anciens au moment du déploiement.
- **Le cron quotidien `expiration-password-admin`** enchaîne trois phases
  (synchronisation, création d'actions idempotentes `action_password`,
  exécution) sur le modèle de la désactivation des comptes inactifs. Les
  actions en échec sont rejouées le lendemain.
- **À l'expiration, le compte n'est pas bloqué** : PILOTE ajoute l'action
  requise `UPDATE_PASSWORD` dans Keycloak et révoque les sessions. Le
  changement est imposé à la connexion suivante.
- **La phase 3 est idempotente** : avant d'agir, elle revérifie que le suivi
  justifie encore l'action (même règle de domaine qu'en phase 2). Une action
  devenue obsolète (mot de passe changé entre-temps, relance déjà posée) est
  écartée sans erreur. Un suivi n'est pris en compte que tant que le compte
  est actif et de profil `DITP_ADMIN`.
- Le cron est réservé à `PROD` et activé par le feature flip
  `NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN`, enregistré dans le registre des
  flips pilotable depuis l'admin (coupure sans redéploiement).
- Le cron refuse de s'exécuter tant que `BREVO_TEMPLATE_EXPIRATION_PASSWORD_ID`
  n'est pas renseigné : forcer un mot de passe sans pouvoir prévenir
  l'utilisateur serait pire que ne rien faire.

## Conséquences

- Configuration manuelle du realm Keycloak à réaliser avant activation :
  politique « Not Recently Used », rôles `view-users` et `manage-users` pour le
  client d'import.
- Un template Brevo dédié doit exister ; son identifiant est fourni par la
  variable d'environnement `BREVO_TEMPLATE_EXPIRATION_PASSWORD_ID`.
- Un `DITP_ADMIN` sans credential `password` (connexion ProConnect
  uniquement) n'est pas soumis au cycle.
- Le journal d'audit des changements de mot de passe et le rapport des comptes
  expirés sont reportés à une décision ultérieure. Les tables sont conçues pour
  les accueillir sans migration des données existantes.
- Un changement de mot de passe fait dans Keycloak n'est pris en compte qu'au
  prochain passage du cron, soit au plus 24 heures après.
