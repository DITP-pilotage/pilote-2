# Recommandations pour l'implémentation du système d'historique d'événements

## ⚠️ Attention : Champs à exclure de l'historique

**CRITIQUE** : Les champs se terminant par `*_mandat` sont des valeurs calculées et ne doivent PAS être historisées.

### Champs à EXCLURE (calculés) :
- `valeur_actuelle_mandat`
- `valeur_cible_mandat` 
- `taux_avancement_mandat`
- `date_valeur_actuelle_mandat`
- `date_valeur_cible_mandat`
- `taux_avancement_mandat_valeur_precedente`
- `date_taux_avancement_mandat_valeur_precedente`

### Champs à INCLURE (valeurs sources) :
- `valeur_initiale` (table `indicateur_territoire`)
- `date_valeur_initiale` (table `indicateur_territoire`)
- `valeur_cible` (table `indicateur_territoire_jalon`)
- `taux_avancement` (table `indicateur_territoire_jalon`)
- `date_valeur_cible` (table `indicateur_territoire_jalon`)
- `date_valeur_actuelle` (table `indicateur_territoire_jalon`)
- Toutes les propositions (table `proposition_valeur_actuelle`)

### Exemple pratique de distinction :

```typescript
// ❌ MAUVAIS : Historiser les valeurs calculées
export class MauvaisExempleService {
  async creerEvenement(indicateur: IndicateurTerritoire) {
    // Ces valeurs sont calculées, ne pas les historiser !
    const evenement = IndicateurValeurEvenement.creer({
      valeurNouvelle: indicateur.valeurActuelleMandat, // ❌ ERREUR
      dateValeur: indicateur.dateValeurActuelleMandat,  // ❌ ERREUR
    });
  }
}

// ✅ CORRECT : Historiser les valeurs sources
export class BonExempleService {
  async creerEvenement(indicateur: IndicateurTerritoire) {
    // Historiser uniquement les valeurs sources
    const evenement = IndicateurValeurEvenement.creer({
      valeurNouvelle: indicateur.valeurInitiale,      // ✅ CORRECT
      dateValeur: indicateur.dateValeurInitiale,      // ✅ CORRECT
    });
  }
  
  async creerEvenementJalon(jalon: IndicateurTerritoireJalon) {
    // Pour les jalons, utiliser les valeurs directes
    const evenement = IndicateurValeurEvenement.creer({
      jalon: jalon.jalon,
      valeurNouvelle: jalon.valeurCible,              // ✅ CORRECT
      dateValeur: jalon.dateValeurCible,              // ✅ CORRECT
    });
  }
}
```

## Éléments importants à ne pas oublier

### 1. Gestion des permissions et sécurité

**Problème** : L'historique contient des informations sensibles qui doivent être protégées selon les habilitations utilisateur.

**Solution** :
```typescript
// Exemple d'implémentation des permissions
export class HistoriquePermissionService {
  async verifierAccesHistorique({
    utilisateurId,
    indicId,
    territoireCode,
    habilitations,
  }: {
    utilisateurId: string;
    indicId: string;
    territoireCode: string;
    habilitations: Habilitation[];
  }): Promise<boolean> {
    // Vérifier les permissions standard sur l'indicateur
    const aAccesIndicateur = this.verifierAccesIndicateur(habilitations, indicId);
    
    // Vérifier les permissions territoire
    const aAccesTerritoire = this.verifierAccesTerritoire(habilitations, territoireCode);
    
    // Vérifier si l'utilisateur peut voir l'historique (règle métier)
    const aAccesHistorique = this.verifierAccesHistorique(habilitations);
    
    return aAccesIndicateur && aAccesTerritoire && aAccesHistorique;
  }
}
```

### 2. Cohérence des données lors de la migration

**Problème** : Risque d'incohérence entre l'ancien système et le nouveau pendant la phase de transition.

**Solution** :
```typescript
// Service de validation de cohérence
export class CoherenceValidationService {
  async validerCoherenceIndicateur(indicId: string, territoireCode: string): Promise<boolean> {
    // Récupérer l'état depuis l'ancien système
    const etatAncien = await this.recupererEtatAncien(indicId, territoireCode);
    
    // Reconstituer l'état depuis les événements
    const etatNouveau = await this.reconstituerEtatDepuisEvenements(indicId, territoireCode);
    
    // Comparer et logger les différences
    const differences = this.comparerEtats(etatAncien, etatNouveau);
    
    if (differences.length > 0) {
      await this.loggerDifferences(indicId, territoireCode, differences);
      return false;
    }
    
    return true;
  }
}
```

### 3. Gestion des imports massifs

**Problème** : Les imports peuvent générer des milliers d'événements d'un coup, impactant les performances.

**Solution** :
```typescript
// Stratégie d'import optimisée
export class ImportEvenementService {
  async creerEvenementsImport({
    donneesImport,
    rapportId,
    utilisateurId,
  }: {
    donneesImport: DonneeImport[];
    rapportId: string;
    utilisateurId: string;
  }) {
    // Créer les événements par batch pour éviter les timeouts
    const batchSize = 1000;
    const batches = this.creerBatches(donneesImport, batchSize);
    
    for (const batch of batches) {
      await this.traiterBatch(batch, rapportId, utilisateurId);
      
      // Pause entre les batches pour éviter la surcharge
      await this.pause(100);
    }
  }
  
  private async traiterBatch(batch: DonneeImport[], rapportId: string, utilisateurId: string) {
    const evenements = batch.map(donnee => 
      IndicateurValeurEvenement.creerEvenementImport({
        ...donnee,
        contexteImport: { rapportId },
        auteurId: utilisateurId,
      })
    );
    
    // Utiliser une transaction pour garantir la cohérence
    await this.evenementRepository.creerEvenements(evenements);
  }
}
```

### 4. Gestion des notifications et alertes

**Problème** : Les utilisateurs doivent être notifiés des changements importants.

**Solution** :
```typescript
// Service de notification basé sur les événements
export class NotificationEvenementService {
  async gererNotificationEvenement(evenement: IndicateurValeurEvenement) {
    const reglesNotification = await this.recupererReglesNotification(evenement.indicId);
    
    for (const regle of reglesNotification) {
      if (this.evenementCorrespondARegle(evenement, regle)) {
        await this.envoyerNotification(evenement, regle);
      }
    }
  }
  
  private async envoyerNotification(evenement: IndicateurValeurEvenement, regle: RegleNotification) {
    const destinataires = await this.recupererDestinataires(regle);
    
    // Envoyer email, notification push, etc.
    await this.notificationService.envoyer({
      destinataires,
      type: 'modification_indicateur',
      donnees: {
        indicateurNom: evenement.indicateur.nom,
        territoireNom: evenement.territoire.nom,
        valeurPrecedente: evenement.valeurPrecedente,
        valeurNouvelle: evenement.valeurNouvelle,
        auteur: evenement.auteur.nom,
        motif: evenement.motif,
      },
    });
  }
}
```

### 5. Archivage et rétention des données

**Problème** : La table d'événements peut devenir très volumineuse.

**Solution** :
```sql
-- Stratégie d'archivage
CREATE TABLE indicateur_valeur_evenement_archive (
  LIKE indicateur_valeur_evenement INCLUDING ALL
);

-- Procédure d'archivage mensuelle
CREATE OR REPLACE FUNCTION archiver_evenements_anciens()
RETURNS void AS $$
BEGIN
  -- Archiver les événements de plus de 2 ans
  INSERT INTO indicateur_valeur_evenement_archive
  SELECT * FROM indicateur_valeur_evenement
  WHERE date_evenement < NOW() - INTERVAL '2 years';
  
  -- Supprimer les événements archivés
  DELETE FROM indicateur_valeur_evenement
  WHERE date_evenement < NOW() - INTERVAL '2 years';
  
  -- Mettre à jour les statistiques
  ANALYZE indicateur_valeur_evenement;
END;
$$ LANGUAGE plpgsql;
```

### 6. Métriques et monitoring

**Problème** : Il faut surveiller la santé du système et les performances.

**Solution** :
```typescript
// Service de métriques
export class MetriquesEvenementService {
  async collecterMetriques() {
    const metriques = {
      // Volume d'événements
      evenementsParJour: await this.compterEvenementsParJour(),
      evenementsParType: await this.compterEvenementsParType(),
      
      // Performance
      tempsRequeteHistorique: await this.mesurerTempsRequete(),
      
      // Qualité des données
      tauxCoherence: await this.calculerTauxCoherence(),
      
      // Utilisation
      utilisateursConsultantHistorique: await this.compterUtilisateursActifs(),
    };
    
    // Envoyer les métriques à un système de monitoring
    await this.envoyerMetriques(metriques);
  }
}
```

### 7. Tests de charge et performance

**Problème** : Il faut s'assurer que le système supporte la charge.

**Solution** :
```typescript
// Tests de performance
describe('Performance historique événements', () => {
  test('Requête historique avec 10k événements < 500ms', async () => {
    // Créer 10k événements de test
    await this.creerEvenements(10000);
    
    const debut = Date.now();
    const historique = await this.historiqueService.recupererHistorique(
      'INDIC_TEST',
      'DEPT_01',
      { limite: 100 }
    );
    const duree = Date.now() - debut;
    
    expect(duree).toBeLessThan(500);
    expect(historique.length).toBe(100);
  });
  
  test('Création d\'événements par batch', async () => {
    const evenements = this.genererEvenements(5000);
    
    const debut = Date.now();
    await this.evenementService.creerEvenements(evenements);
    const duree = Date.now() - debut;
    
    // Doit traiter 5000 événements en moins de 10 secondes
    expect(duree).toBeLessThan(10000);
  });
});
```

### 8. Intégration avec les outils existants

**Problème** : L'historique doit s'intégrer avec les outils de BI et les exports.

**Solution** :
```sql
-- Vue pour les outils de BI
CREATE VIEW v_historique_indicateurs_bi AS
SELECT 
  e.indic_id,
  e.territoire_code,
  t.nom AS territoire_nom,
  i.nom AS indicateur_nom,
  i.chantier_id,
  e.type_evenement,
  e.type_valeur,
  e.valeur_precedente,
  e.valeur_nouvelle,
  e.date_evenement,
  e.date_valeur,
  u.nom AS auteur_nom,
  u.email AS auteur_email,
  e.motif,
  EXTRACT(YEAR FROM e.date_evenement) AS annee,
  EXTRACT(MONTH FROM e.date_evenement) AS mois
FROM indicateur_valeur_evenement e
JOIN territoire t ON e.territoire_code = t.code
JOIN indicateur_identite i ON e.indic_id = i.id
JOIN utilisateur u ON e.auteur_id = u.id
WHERE e.date_evenement >= NOW() - INTERVAL '5 years'; -- Limiter aux 5 dernières années
```

### 9. Gestion des erreurs et rollback

**Problème** : Il faut pouvoir corriger les erreurs sans perdre l'historique.

**Solution** :
```typescript
// Service de correction d'erreurs
export class CorrectionEvenementService {
  async corrigerEvenement({
    evenementId,
    nouvelleValeur,
    motifCorrection,
    auteurId,
  }: {
    evenementId: string;
    nouvelleValeur: number;
    motifCorrection: string;
    auteurId: string;
  }) {
    // Ne jamais modifier un événement existant
    // À la place, créer un événement de correction
    const evenementCorrection = IndicateurValeurEvenement.creerEvenementCorrection({
      evenementOriginalId: evenementId,
      nouvelleValeur,
      motifCorrection,
      auteurId,
    });
    
    await this.evenementRepository.creerEvenement(evenementCorrection);
    
    // Marquer l'événement original comme corrigé
    await this.evenementRepository.marquerCommeCorrige(evenementId);
  }
}
```

### 10. Documentation et formation

**Problème** : L'équipe doit comprendre le nouveau système.

**Solution** :
- **Guide de migration** : Étapes détaillées pour chaque développeur
- **Documentation API** : Endpoints et exemples d'utilisation
- **Formation utilisateurs** : Comment utiliser les nouvelles fonctionnalités d'historique
- **Playbook incidents** : Procédures pour résoudre les problèmes

## Checklist de validation

### Technique
- [ ] Schéma de base de données validé
- [ ] Index de performance créés
- [ ] Scripts de migration testés
- [ ] Tests unitaires et d'intégration
- [ ] Tests de charge passés
- [ ] Monitoring mis en place

### Fonctionnel
- [ ] Toutes les fonctionnalités existantes maintenues
- [ ] Interface d'historique développée
- [ ] Permissions et sécurité vérifiées
- [ ] Notifications configurées
- [ ] Exports et intégrations BI testés

### Opérationnel
- [ ] Plan de rollback testé
- [ ] Procédures d'archivage documentées
- [ ] Alertes de monitoring configurées
- [ ] Formation équipe réalisée
- [ ] Documentation utilisateur rédigée

## Ordre de priorité des développements

1. **Critique** : Schéma de base de données et migration des données
2. **Critique** : Dual-write et cohérence des données
3. **Important** : Interface utilisateur pour l'historique
4. **Important** : Permissions et sécurité
5. **Moyen** : Notifications et alertes
6. **Moyen** : Optimisations de performance
7. **Faible** : Archivage et rétention
8. **Faible** : Métriques avancées et monitoring

Cette approche progressive permet de minimiser les risques tout en apportant rapidement de la valeur aux utilisateurs. 
