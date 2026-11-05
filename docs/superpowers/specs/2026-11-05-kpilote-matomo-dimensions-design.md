# kpilote — dimensions Matomo administrables

Date : 2026-11-05 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-matomo-dimensions` (empilée sur le lot 6, avant le lot 7)

## Intention

Ranger le contexte des événements et pages vues dans les dimensions personnalisées de Matomo, et
gérer leur correspondance (clé de contexte → numéro de dimension Matomo) dans kpilote-admin plutôt que
dans une variable d'environnement (comme `NEXT_PUBLIC_MATOMO_DIMENSIONS` sur PPG). Choix du user :
une PR à part, transverse à kpilote ; PPG passera au même modèle dans un ticket séparé.

## Décisions

- **Table `analytics_dimension`** : `cle` (clé de contexte, identifiant), `slot` (numéro de la dimension
  dans Matomo, unique), `nom` (libellé lisible). Vide à la création : sans correspondance, le contexte
  reste replié dans le nom de l'événement, comme aujourd'hui.
- **API** : `GET /analytics/dimensions` **publique** (la correspondance n'a rien de sensible et la
  webapp en a besoin avant la connexion) ; `PUT /analytics/dimensions/{cle}` (crée ou modifie) et
  `DELETE /analytics/dimensions/{cle}` réservées aux clés API ADMIN. Un numéro déjà pris → 409.
- **Clé** : `^[a-z][a-z0-9_]{0,49}$` (format des clés de contexte). **Numéro** : entier de 1 à 999.
- **Webapp** : au démarrage, lit la correspondance et la donne au tracker. Le tracker garde ses envois
  en attente jusque-là (au plus 3 s, puis envoie sans dimensions) : la première page vue en profite.
- **kpilote-admin** : page « Dimensions Matomo » (liste, ajout, modification du numéro et du libellé,
  suppression), verrouillée en production comme les autres pages d'édition ; carte sur l'accueil.

## Hors périmètre

PPG (ticket séparé). Création des dimensions côté Matomo (faite dans Matomo, on n'y reporte que leur
numéro).

## Tests

API (lecture publique triée par numéro, garde ADMIN, 409 sur numéro pris, 404 à la suppression d'une
clé inconnue, clé invalide → 400) ; tracker (mise en attente puis envoi avec les dimensions, délai
dépassé) ; proxy (`analytics` relayé).
