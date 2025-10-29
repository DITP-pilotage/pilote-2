# Plan de Désactivation des Comptes Inactifs

## Objectif

Créer un script TypeScript qui permet de désactiver les comptes qui n'ont pas eu de connexions depuis plus de 3 mois (90 jours). Un système de notifications par email sera mis en place pour avertir les utilisateurs 30 jours et 7 jours avant la désactivation.

## Vue d'ensemble

Le script effectuera les actions suivantes :
- Récupérer depuis Keycloak la dernière date de connexion des utilisateurs
- Identifier les comptes inactifs depuis plus de 60 jours
- Envoyer des emails de notification à J-30 et J-7 avant désactivation
- Désactiver automatiquement les comptes inactifs depuis plus de 90 jours

## Étapes de Développement

### Étape 1 : Création du script vide

**Objectif** : Mettre en place la structure de base du script

#### Tâche
1. Créer un script vide dans `scripts/` qui retourne :
   - Un `console.log` en cas de succès
   - Un `console.log` en cas d'échec

**Fichier à créer** : `scripts/desactivationComptesInactifs.ts`

---

### Étape 2 : Récupérer les comptes inactifs

**Objectif** : Identifier les comptes inactifs et déterminer les actions à entreprendre

#### Tâches

##### 2.1 Créer la fonction de récupération Keycloak

**Fichier** : `src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts`

Créer une fonction qui :
- À l'aide de Keycloak, récupère la dernière date de connexion de chaque utilisateur
- Retourne les emails des comptes inactifs depuis plus de 60 jours
- Retourne le nombre de jours d'inactivité pour chaque compte

**Signature attendue** :
```typescript
async recupererComptesInactifs(): Promise<{ email: string; joursInactivite: number }[]>
```

##### 2.2 Implémenter la logique de traitement dans le script

**Fichier** : `scripts/desactivationComptesInactifs.ts`

Utiliser la fonction créée en 2.1 et boucler sur la liste des comptes inactifs :

| Jours d'inactivité | Action |
|-------------------|--------|
| > 90 jours | Désactiver le compte |
| = 83 jours | Envoyer un mail "7 jours avant désactivation" |
| = 60 jours | Envoyer un mail "30 jours avant désactivation" |

**Note** : Pour cette étape, remplacer l'envoi de mails par des `console.log` pour le debug.

##### 2.3 Test manuel

Je ferai tourner le script pour m'assurer que la récupération et la logique fonctionnent correctement.

---

### Étape 3 : Envoi des mails avec Brevo

**Objectif** : Implémenter l'envoi effectif des emails de notification

#### Tâches

##### 3.1 Intégration du service d'email

**Fichier** : `scripts/desactivationComptesInactifs.ts`

Utiliser la fonction `envoieUnEmail` du service `BrevoContactInfoLettresService` :

**Paramètres** :
- `destinataires` : `[{ email: string }]`
- `templateId` : `39`
- `parametres` : `{ joursAvantDesactivation: number }`

**Cas d'utilisation** :
- À 60 jours d'inactivité : envoyer mail avec `{ joursAvantDesactivation: 30 }`
- À 83 jours d'inactivité : envoyer mail avec `{ joursAvantDesactivation: 7 }`

**Référence** : `src/server/gestion-utilisateur/infrastructure/adapters/BrevoContactInfoLettresService.ts:73-83`

---

### Étape 4 : Mettre en place la désactivation des comptes

**Statut** : À définir ultérieurement

Le plan détaillé de cette étape sera créé après validation des étapes précédentes.

**Questions à résoudre** :
- Quelle méthode utiliser pour désactiver un compte ?
- Faut-il utiliser la fonction `desactiver()` existante dans `PrismaUtilisateurRepository` ?
- Quel auteurId utiliser pour la désactivation automatique ?
- Faut-il créer un utilisateur système pour ces opérations automatiques ?

---

## Fichiers Impactés

### Fichiers à créer
- `scripts/desactivationComptesInactifs.ts` - Script principal

### Fichiers à modifier
- `src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts` - Ajout de la fonction de récupération Keycloak

### Fichiers de référence
- `src/server/gestion-utilisateur/infrastructure/adapters/BrevoContactInfoLettresService.ts` - Service d'envoi d'emails
- `scripts/suppressionUtilisateursInactifs.ts` - Script similaire existant pour référence

---

## Notes Techniques

### Connexion Keycloak
Il faudra utiliser l'API Keycloak pour récupérer les sessions utilisateurs et identifier la dernière connexion. Les informations de connexion Keycloak devront être récupérées depuis la configuration.

### Seuils de notification
- **J-30** (60 jours d'inactivité) : Premier avertissement
- **J-7** (83 jours d'inactivité) : Dernier avertissement
- **J-0** (90 jours d'inactivité) : Désactivation effective

### Template Email Brevo
- Template ID : `39`
- Variable : `joursAvantDesactivation` (30 ou 7)

---

## Exécution du Script

Le script sera exécuté via une commande npm (à définir) ou directement avec ts-node.

Script à créer : `scripts/run_desactivation_comptes_inactifs.sh`