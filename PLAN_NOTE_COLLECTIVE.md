# Plan d'implémentation : Affichage de la note collective

## Objectif
Afficher la "note collective" à côté des moyennes des auto-évaluations dans `ListeAutoEvaluations.tsx`.

## Étape 1 : Créer le lien entre fiche_evaluation et chantier_evaluation

### 1.1 Ajouter le champ jalon aux tables chantier_evaluation et indicateur_evaluation

**Fichier:** `src/database/prisma/schema.prisma`

Dans le modèle `chantier_evaluation` (lignes 927-938), ajouter le champ `jalon`:
```prisma
model chantier_evaluation {
  id              String
  code_insee      String
  maille          Maille
  territoire_code String
  zone_id         String
  taux_avancement Float?
  date_calcul     DateTime @db.Date
  jalon           Int      // <- NOUVEAU CHAMP

  @@id([id, territoire_code, date_calcul])
  @@schema("public")
}
```

Dans le modèle `indicateur_evaluation` (lignes 940-954), ajouter le champ `jalon`:
```prisma
model indicateur_evaluation {
  id                   String
  chantier_id          String
  territoire_code      String
  code_insee           String
  maille               Maille
  zone_id              String
  taux_avancement      Float?
  ponderation_declaree Float
  ponderation_reelle   Float
  date_calcul          DateTime @db.Date
  jalon                Int      // <- NOUVEAU CHAMP

  @@id([id, territoire_code, date_calcul])
  @@schema("public")
}
```

### 1.2 Créer la relation entre fiche_evaluation et chantier_evaluation

**Fichier:** `src/database/prisma/schema.prisma`

Modifier le modèle `chantier_evaluation` pour ajouter la relation:
```prisma
model chantier_evaluation {
  id                String
  code_insee        String
  maille            Maille
  territoire_code   String
  zone_id           String
  taux_avancement   Float?
  date_calcul       DateTime @db.Date
  jalon             Int
  fiche_evaluation  fiche_evaluation? @relation(fields: [territoire_code, jalon], references: [rattachement_code, jalon])

  @@id([id, territoire_code, date_calcul])
  @@schema("public")
}
```

Modifier le modèle `fiche_evaluation` (lignes 821-833) pour ajouter la relation inverse:
```prisma
model fiche_evaluation {
  id                    String                   @id @db.Uuid
  jalon                 Int
  etape_courante        etape_evaluation_enum
  rattachement_code     String
  rattachement          referentiel_rattachement @relation(fields: [rattachement_code], references: [code], onDelete: Cascade, onUpdate: Cascade)
  created_at            DateTime                 @default(now())
  updated_at            DateTime                 @updatedAt
  etape_evaluations     etape_evaluation[]
  chantiers_evaluation  chantier_evaluation[]    // <- NOUVELLE RELATION

  @@unique([rattachement_code, jalon])
  @@schema("public")
}
```

### 1.3 Créer et lancer la migration

**Action manuelle:** Exécuter les commandes suivantes:
```bash
npx prisma migrate dev --name add_jalon_and_relation_chantier_evaluation
npm run database:migration
```

### 1.4 Mettre à jour le script de sauvegarde

**Fichier:** `scripts/sauvegarde_notes_evaluation_prefet.ts`

Modifier la fonction `sauvegardeNotes()` pour ajouter le jalon:
```typescript
await prisma.chantier_evaluation.createMany({
  data: chantiers.map((chantier) => ({
    id: chantier.id,
    territoire_code: chantier.territoire_code,
    maille: chantier.maille,
    code_insee: chantier.code_insee,
    taux_avancement: chantier.taux_avancement_eval,
    zone_id: chantier.zone_id,
    date_calcul: new Date(),
    jalon: 2025,  // <- NOUVEAU CHAMP
  })),
});

await prisma.indicateur_evaluation.createMany({
  data: indicateurs.map((indicateur) => ({
    id: indicateur.id,
    chantier_id: indicateur.indicateur_territoire.chantier_id,
    territoire_code: indicateur.territoire_code,
    maille: indicateur.maille,
    code_insee: indicateur.code_insee,
    taux_avancement: indicateur.taux_avancement,
    zone_id: indicateur.zone_id,
    ponderation_declaree:
      indicateur.indicateur_territoire.ponderation_zone_declaree_eval!,
    ponderation_reelle:
      indicateur.indicateur_territoire.ponderation_zone_reel_eval!,
    date_calcul: new Date(),
    jalon: 2025,  // <- NOUVEAU CHAMP
  })),
});
```

---

## Étape 2 : Backend - Calcul de la note collective

### 2.1 Mettre à jour les tests existants

**Fichier:** `src/server/evaluation/__tests__/queries/ListerFichesAutoEvaluationQuery.integration.test.ts`

Ajouter le champ `noteCollective` dans les assertions `expect()`:
- Ligne 103-120: Ajouter `noteCollective: null,`
- Ligne 121-138: Ajouter `noteCollective: null,`

Exemple:
```typescript
expect(result).toContainEqual({
  id: ficheEvaluation1Id,
  etapeCourante: "AUTO_EVALUATION",
  rattachement: {
    code: rattachement1Code,
    libelle: "Rattachement 1",
  },
  objectifs: {
    moyenne: null,
    nombreNotes: 0,
    nombreTotal: 0,
  },
  criteres: {
    moyenne: null,
    nombreNotes: 0,
    nombreTotal: 0,
  },
  noteCollective: null,  // <- NOUVEAU CHAMP
});
```

### 2.2 Créer un nouveau test pour le calcul de la note collective

**Fichier:** `src/server/evaluation/__tests__/queries/ListerFichesAutoEvaluationQuery.integration.test.ts`

Ajouter un nouveau test à la fin de la suite:
```typescript
it("doit calculer la note collective à partir des chantiers_evaluation de la dernière date_calcul", async () => {
  // Given
  const rattachementCode = "REG-205";
  const utilisateurId = "f8a7b6c5-4d3e-2f1a-0b9c-8d7e6f5a4b3c";
  const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const etapeEvaluationId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

  await prisma.utilisateur.create({
    data: {
      id: utilisateurId,
      email: "user-note-collective@example.com",
      nom: "UserNoteCollective",
      prenom: "Test",
      date_creation: new Date(),
      profilCode: "DITP_ADMIN",
    },
  });

  await prisma.referentiel_rattachement.create({
    data: {
      code: rattachementCode,
      libelle: "Rattachement avec note collective",
    },
  });

  await prisma.rattachement_utilisateur_etape_jalon.create({
    data: {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      rattachement_code: rattachementCode,
      utilisateur_id: utilisateurId,
      etape: "AUTO_EVALUATION",
      jalon: 2025,
    },
  });

  await prisma.fiche_evaluation.create({
    data: {
      id: ficheEvaluationId,
      jalon: 2025,
      etape_courante: "AUTO_EVALUATION",
      rattachement_code: rattachementCode,
      etape_evaluations: {
        create: {
          id: etapeEvaluationId,
          type: "AUTO_EVALUATION",
        },
      },
    },
  });

  await prisma.chantier_evaluation.createMany({
    data: [
      // Anciennes évaluations (ne doivent pas être prises en compte)
      {
        id: "CH-001",
        territoire_code: rattachementCode,
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        taux_avancement: 50.0,
        date_calcul: new Date("2025-01-10"),
        jalon: 2025,
      },
      {
        id: "CH-002",
        territoire_code: rattachementCode,
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        taux_avancement: 60.0,
        date_calcul: new Date("2025-01-10"),
        jalon: 2025,
      },
      // Évaluations les plus récentes (doivent être prises en compte)
      {
        id: "CH-001",
        territoire_code: rattachementCode,
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        taux_avancement: 75.5,
        date_calcul: new Date("2025-01-15"),
        jalon: 2025,
      },
      {
        id: "CH-002",
        territoire_code: rattachementCode,
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        taux_avancement: 84.5,
        date_calcul: new Date("2025-01-15"),
        jalon: 2025,
      },
      {
        id: "CH-003",
        territoire_code: rattachementCode,
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        taux_avancement: null,
        date_calcul: new Date("2025-01-15"),
        jalon: 2025,
      },
    ],
  });

  // When
  const result = await query.run({ utilisateurId });

  // Then
  expect(result).toHaveLength(1);
  expect(result[0]).toEqual({
    id: ficheEvaluationId,
    etapeCourante: "AUTO_EVALUATION",
    rattachement: {
      code: rattachementCode,
      libelle: "Rattachement avec note collective",
    },
    objectifs: {
      moyenne: null,
      nombreNotes: 0,
      nombreTotal: 0,
    },
    criteres: {
      moyenne: null,
      nombreNotes: 0,
      nombreTotal: 0,
    },
    noteCollective: 80, // Moyenne de 75.5 et 84.5 (dernière date_calcul uniquement) = 80
  });
});
```

### 2.3 Lancer les tests pour vérifier qu'ils sont rouges

**Action manuelle:** Exécuter:
```bash
npm run test:server -- ListerFichesAutoEvaluationQuery
```

### 2.4 Implémenter le calcul de la note collective

**Fichier:** `src/server/evaluation/queries/ListerFichesAutoEvaluationQuery.ts`

Modifier la requête Prisma pour inclure les chantiers_evaluation (lignes 13-43):
```typescript
const fichesEvaluation = await this.dependencies.prisma
  .getInstance()
  .fiche_evaluation.findMany({
    where: {
      etape_evaluations: {
        some: { type: $Enums.etape_evaluation_enum.AUTO_EVALUATION },
      },
      rattachement: {
        rattachement_utilisateur_etape_jalon: {
          some: {
            etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            utilisateur_id: utilisateurId,
          },
        },
      },
    },
    include: {
      rattachement: {
        include: {
          objectifs: true,
        },
      },
      etape_evaluations: {
        where: { type: $Enums.etape_evaluation_enum.AUTO_EVALUATION },
        include: {
          evaluations_objectifs: true,
          evaluations_criteres: true,
        },
      },
      chantiers_evaluation: true,  // <- NOUVELLE INCLUSION
    },
  });
```

Ajouter le calcul de la note collective dans le mapping (après la ligne 84):
```typescript
return fichesEvaluation.map((fiche) => {
  const etapeAutoEvaluation = fiche.etape_evaluations[0];

  // ... code existant pour objectifs et critères ...

  // Calculer la note collective
  const chantiersAvecTaux = fiche.chantiers_evaluation.filter(
    (chantier) => chantier.taux_avancement !== null
  );

  const noteCollective =
    chantiersAvecTaux.length > 0
      ? Math.round(
          chantiersAvecTaux.reduce(
            (sum, chantier) => sum + chantier.taux_avancement!,
            0
          ) / chantiersAvecTaux.length
        )
      : null;

  return {
    id: fiche.id,
    etapeCourante: fiche.etape_courante,
    rattachement: {
      code: fiche.rattachement.code,
      libelle: fiche.rattachement.libelle,
    },
    objectifs: {
      moyenne:
        moyenneObjectifs && moyenneObjectifs.count > 0
          ? Math.round(moyenneObjectifs.total / moyenneObjectifs.count)
          : null,
      nombreNotes: moyenneObjectifs?.count ?? 0,
      nombreTotal: objectifsAvecNotes.length,
    },
    criteres: {
      moyenne:
        moyenneCriteres && moyenneCriteres.count > 0
          ? Math.round(moyenneCriteres.total / moyenneCriteres.count)
          : null,
      nombreNotes: moyenneCriteres?.count ?? 0,
      nombreTotal: criteresAvecNotes.length,
    },
    noteCollective,  // <- NOUVEAU CHAMP
  };
});
```

### 2.5 Vérifier que les tests passent au vert

**Action manuelle:** Exécuter:
```bash
npm run test:server -- ListerFichesAutoEvaluationQuery
```

---

## Étape 3 : Affichage de la note collective en front

### 3.1 Mettre à jour le type FicheEvaluation

**Fichier:** `src/client/components/Evaluation/ListeAutoEvaluations.tsx`

Modifier le type `FicheEvaluation` (lignes 6-23):
```typescript
type FicheEvaluation = {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  noteCollective: number | null;  // <- NOUVEAU CHAMP
};
```

### 3.2 Ajouter une nouvelle CardEvaluation pour la note collective

**Fichier:** `src/client/components/Evaluation/ListeAutoEvaluations.tsx`

Modifier la grille pour inclure la carte de note collective (lignes 109-127):
```typescript
<div className="p-6">
  <div className="grid grid-cols-3 gap-4">
    <CardEvaluation
      lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}#objectifs`}
      moyenne={ficheEvaluation.objectifs.moyenne}
      nombreNotes={ficheEvaluation.objectifs.nombreNotes}
      nombreTotal={ficheEvaluation.objectifs.nombreTotal}
      titre="Objectifs individuels"
    />
    <CardEvaluation
      lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}`}
      moyenne={ficheEvaluation.criteres.moyenne}
      nombreNotes={ficheEvaluation.criteres.nombreNotes}
      nombreTotal={ficheEvaluation.criteres.nombreTotal}
      titre="Manière de servir"
      variant="secondary"
    />
    <CardEvaluation
      lien={`/evaluation/auto-evaluation/${ficheEvaluation.id}#note-collective`}
      moyenne={ficheEvaluation.noteCollective}
      nombreNotes={ficheEvaluation.noteCollective !== null ? 1 : 0}
      nombreTotal={1}
      titre="Note collective"
    />
  </div>
</div>
```

### 3.3 Tester visuellement l'affichage

**Actions manuelles:**
1. Lancer le serveur de développement: `npm run dev`
2. Se connecter avec un utilisateur ayant accès à une fiche d'auto-évaluation
3. Vérifier que la note collective s'affiche correctement
4. Vérifier le cas où `noteCollective` est `null`

---

## Checklist de validation

- [ ] Étape 1.1: Champs `jalon` ajoutés dans le schema Prisma
- [ ] Étape 1.2: Relations créées entre `fiche_evaluation` et `chantier_evaluation`
- [ ] Étape 1.3: Migration créée et exécutée avec succès
- [ ] Étape 1.4: Script de sauvegarde mis à jour
- [ ] Étape 2.1: Tests existants mis à jour avec le nouveau champ
- [ ] Étape 2.2: Nouveau test créé pour le calcul de la note collective
- [ ] Étape 2.3: Tests rouges confirmés
- [ ] Étape 2.4: Implémentation du calcul de la note collective
- [ ] Étape 2.5: Tests verts confirmés
- [ ] Étape 3.1: Type `FicheEvaluation` mis à jour
- [ ] Étape 3.2: Composant `CardEvaluation` pour la note collective ajouté
- [ ] Étape 3.3: Tests visuels effectués et validés

---

## Notes techniques

### Calcul de la note collective
La note collective est calculée comme la **moyenne arithmétique** des `taux_avancement` des `chantier_evaluation` associés à une fiche, en excluant les valeurs `null`. Le résultat est arrondi à l'entier le plus proche.

Formule:
```
noteCollective = round(sum(taux_avancement) / count(taux_avancement non null))
```

### Relation fiche_evaluation ↔ chantier_evaluation
- **Cardinalité**: Une fiche peut avoir plusieurs chantiers d'évaluation (1:N)
- **Jointure**: `rattachement_code = territoire_code` ET `jalon = jalon`
- **Cascade**: Pas de cascade DELETE car les données d'évaluation sont historisées

### Affichage front
La carte de note collective utilise le même composant `CardEvaluation` que les objectifs et critères, mais:
- `nombreNotes` et `nombreTotal` sont artificiels (0/1 ou 1/1) car il n'y a pas de notion de progression
- La barre de progression n'est pas affichée si `nombreTotal` est 1
- Le lien pointe vers une ancre `#note-collective` (à implémenter si besoin)
