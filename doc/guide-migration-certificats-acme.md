# Guide de migration vers les certificats Certigna SSL ACME sur Scalingo

## Vue d'ensemble

Ce guide détaille la procédure pour migrer des certificats RGS* Certigna traditionnels vers les nouveaux "Certificat SSL ACME" de Certigna, tout en conservant la conformité réglementaire.

> **Note** : Ce guide accompagne l'[ADR 003 - Migration vers les certificats ACME](./adr/003.%20Migration%20vers%20les%20certificats%20ACME%20sur%20Scalingo.md)

## Prérequis

- CLI Scalingo installé et configuré
- Accès aux applications Scalingo du projet
- Compte Certigna avec droits de commande de certificats
- Droits d'administration sur les domaines

## Infrastructure actuelle

### Applications concernées
- **Webapp principale** : `prod-pilote-ditp` / `dev-pilote-ditp`
- **Keycloak** : `prod-keycloak-ditp` / `dev-keycloak-ditp`

### Domaines configurés
- Production : `*.osc-fr1.scalingo.io` et domaines personnalisés
- Développement : `*.osc-fr1.scalingo.io` et domaines personnalisés

## Avantages des certificats Certigna SSL ACME

### Conformité
- ✅ **Certifications RGS*** maintenues
- ✅ **Conformité eIDAS** (selon niveau choisi)
- ✅ **Éligibilité marchés publics** préservée
- ✅ **Reconnaissance administration française**

### Automatisation
- ✅ **Protocole ACME** : Renouvellement automatique côté Certigna
- ✅ **Durée de vie optimisée** selon les évolutions réglementaires
- ✅ **Réduction du risque** d'expiration

## Procédure de migration

### Étape 1 : Commande des certificats Certigna SSL ACME

#### 1.1 Via l'interface Certigna
1. Se connecter à l'interface de commande Certigna
2. Sélectionner "Certificat SSL ACME"
3. Choisir le niveau : RGS* ou RGS** selon vos besoins
4. Renseigner les domaines (SAN si nécessaire)
5. Configurer le renouvellement automatique ACME

#### 1.2 Configuration ACME chez Certigna
```bash
# Certigna fournit les informations ACME nécessaires
# URL ACME, credentials, etc.
# Configuration automatique du renouvellement
```

### Étape 2 : Récupération des certificats

Une fois générés automatiquement par Certigna :
```bash
# Téléchargement depuis l'interface Certigna
# Ou récupération via API si disponible
# Fichiers obtenus : certificat.crt + clé.key + chaîne si nécessaire
```

### Étape 3 : Import dans Scalingo

#### 3.1 Pour un nouveau domaine
```bash
scalingo --region osc-fr1 --app dev-pilote-ditp domains-add \
  --cert ./certigna-acme.crt \
  --key ./certigna-acme.key \
  votre-domaine.com
```

#### 3.2 Pour remplacer un certificat existant
```bash
# Lister les certificats actuels
scalingo --region osc-fr1 --app prod-pilote-ditp domains-ssl

# Remplacer le certificat
scalingo --region osc-fr1 --app prod-pilote-ditp domains-ssl \
  --cert ./certigna-acme.crt \
  --key ./certigna-acme.key \
  votre-domaine-prod.com
```

### Étape 4 : Vérification post-import

#### 4.1 Vérification Scalingo
```bash
# Vérifier que le certificat est bien associé
scalingo --region osc-fr1 --app prod-pilote-ditp domains

# Vérifier les détails SSL
scalingo --region osc-fr1 --app prod-pilote-ditp domains-ssl
```

#### 4.2 Tests techniques
```bash
# Vérifier l'émetteur (doit être Certigna)
echo | openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com 2>/dev/null | openssl x509 -noout -issuer

# Vérifier la date d'expiration
echo | openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com 2>/dev/null | openssl x509 -noout -dates

# Test de conformité RGS
curl -I https://votre-domaine.com
```

## Processus de renouvellement

### Automatisation côté Certigna
- Certigna gère le renouvellement ACME automatique
- Notification par email avant expiration
- Génération automatique des nouveaux certificats

### Import périodique dans Scalingo
```bash
#!/bin/bash
# Script de renouvellement semi-automatique

DOMAIN="votre-domaine.com"
APP_NAME="prod-pilote-ditp"
CERT_PATH="./certificats"

# 1. Téléchargement du nouveau certificat depuis Certigna
# (à adapter selon l'API Certigna disponible)

# 2. Import dans Scalingo
scalingo --region osc-fr1 --app $APP_NAME domains-ssl \
  --cert $CERT_PATH/certigna-$DOMAIN.crt \
  --key $CERT_PATH/certigna-$DOMAIN.key \
  $DOMAIN

# 3. Vérification
scalingo --region osc-fr1 --app $APP_NAME domains | grep $DOMAIN
```

## Surveillance et monitoring

### Notifications Certigna
- Surveillance des renouvellements ACME automatiques
- Alertes en cas de problème de renouvellement
- Interface de monitoring des certificats actifs

### Surveillance Scalingo
```bash
# Script de vérification périodique
#!/bin/bash
DOMAIN="votre-domaine.com"
EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
  echo "ATTENTION: Certificat $DOMAIN expire dans $DAYS_LEFT jours"
fi
```

## Comparaison avec Let's Encrypt

| Critère | Certigna SSL ACME | Let's Encrypt |
|---------|-------------------|---------------|
| **Conformité RGS*** | ✅ Oui | ❌ Non |
| **Coût** | 💰 Payant | 🆓 Gratuit |
| **Automatisation** | 🔄 Semi-automatique | ⚡ Complète |
| **Support Scalingo** | 📥 Import manuel | 🤖 Natif |
| **Niveau de confiance** | 🏛️ Gouvernemental | 🌐 Commercial |
| **Marchés publics** | ✅ Éligible | ❌ Peut être exclu |

## Troubleshooting

### Problème : Import de certificat échoue
**Cause** : Format de certificat incorrect ou clé non correspondante
**Solution** :
```bash
# Vérifier la correspondance certificat/clé
openssl x509 -noout -modulus -in certigna.crt | openssl md5
openssl rsa -noout -modulus -in certigna.key | openssl md5
# Les hash doivent être identiques

# Vérifier le format
openssl x509 -in certigna.crt -text -noout
```

### Problème : Certificat Certigna ACME non généré
**Cause** : Configuration ACME incorrecte chez Certigna
**Solution** : 
- Vérifier la configuration DNS
- Contacter le support Certigna
- Vérifier l'accessibilité du domaine

### Problème : Application inaccessible après import
**Cause** : Certificat défaillant ou mal configuré
**Solution** :
```bash
# Vérifier le statut du domaine
scalingo --app votre-app domains

# Redémarrer l'application si nécessaire
scalingo --app votre-app restart
```

## Actions de secours

### Rollback vers l'ancien certificat
```bash
# Ré-importer l'ancien certificat Certigna
scalingo --app votre-app domains-ssl \
  --cert ancien-certigna.crt \
  --key ancien-certigna.key \
  votre-domaine.com
```

### Basculer temporairement vers Let's Encrypt
```bash
# En cas d'urgence absolue
scalingo --app votre-app domains-ssl --cert-remove votre-domaine.com
# Let's Encrypt prendra automatiquement le relais
```

> ⚠️ **Important** : Conserver les anciens certificats jusqu'à validation complète

## Contacts et support

- **Support Certigna** : Pour questions sur les certificats SSL ACME
- **Support Scalingo** : Via le dashboard ou support technique  
- **Documentation Certigna** : Interface de gestion des certificats
- **Équipe projet** : Pour questions spécifiques au projet

## Références

- [ADR 003 - Migration vers les certificats ACME avec Certigna](./adr/003.%20Migration%20vers%20les%20certificats%20ACME%20sur%20Scalingo.md)
- [Documentation Scalingo SSL](https://doc.scalingo.com/platform/app/ssl)
- [Certigna Certificats SSL ACME](https://www.certigna.fr/) 
- [Protocole ACME RFC 8555](https://tools.ietf.org/html/rfc8555) 
