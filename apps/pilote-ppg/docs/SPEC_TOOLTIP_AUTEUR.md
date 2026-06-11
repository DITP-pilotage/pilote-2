# Spec — Affichage du service et de la fonction au survol des noms d'auteurs

## Contexte

Sur la page chantier, plusieurs zones affichent des noms d'utilisateurs (auteurs de publications, auteurs de propositions de valeur d'avancement). On veut que le survol d'un nom affiche son service et sa fonction pour faciliter l'identification.

## Périmètre

| Zone | Comportement |
|---|---|
| Publications (commentaires, synthèse, objectifs, décisions stratégiques) | Tooltip au survol : `Service : ...` / `Fonction : ...` |
| Propositions de valeur d'avancement (PVA) | Texte inline `(service)` après le nom, dans l'infobulle existante |
| Responsables (DirecteurProjet, ResponsableLocal, Coordinateur) | **Hors scope — PR séparée** |

---

## Analyse de l'existant

### Publications

Les 4 types de publications utilisent le **nouveau système** (module V2) avec des FK vers `utilisateur` :

- Les queries (`RecupererDernierCommentaireQuery`, `RecupererDerniersObjectifsQuery`, `RecupererDerniereDecisionStrategiqueQuery`, `RecupererDerniereSyntheseDesResultatsQuery`) font déjà un `include: { auteur_creation: true, auteur_modification: true }` **mais ne sélectionnent que `prenom` et `nom`**.
- Les interfaces domaine (`CommentaireAvecNomsAuteurs`, `ObjectifV2AvecNomAuteur`, `DecisionStrategiqueV2AvecNomsAuteurs`, `SyntheseDesResultatsAvecNomsAuteurs`) exposent uniquement les noms concaténés.
- L'interface client `Publication` (`Publication.interface.ts`) n'a pas de champs `service`/`fonction`.
- `AffichagePublication.tsx` rend les métadonnées auteur via une template string (non hoverable en l'état).

### PVA

- `PrismaIndicateurRepository` fait déjà un `include` sur `auteur` (utilisateur), mais ne sélectionne que `nom` et `prenom` (lignes 891-896).
- `DetailIndicateurPropositionValeurAvancement.auteur` est une string concaténée, sans service.
- `CelluleStatutProposition` affiche l'auteur dans une `Infobulle` existante — pas de tooltip supplémentaire à créer, juste un enrichissement inline.

---

## Modifications backend

### 1. Queries publications — ajouter `service`, `service_autre` et `fonction` au select utilisateur

Dans chacune des 4 queries, le `include` utilisateur passe de :

```typescript
select: { prenom: true, nom: true }
```

à :

```typescript
select: { prenom: true, nom: true, service: true, service_autre: true, fonction: true }
```

Fichiers concernés :
- `src/server/commentaires/queries/RecupererDernierCommentaireQuery.ts`
- `src/server/objectifs/queries/RecupererDerniersObjectifsQuery.ts`
- `src/server/decisions-strategiques/queries/RecupererDerniereDecisionStrategiqueQuery.ts`
- `src/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery.ts`

### 2. Interfaces domaine — ajouter les champs auteur

Pour les 4 interfaces `AvecNomsAuteurs`, ajouter :

```typescript
auteurCreationService: string | null;
auteurCreationFonction: string | null;
auteurModificationService: string | null;
auteurModificationFonction: string | null;
```

Fichiers concernés :
- `src/server/domain/chantier/commentaire/Commentaire.interface.ts`
- `src/server/domain/chantier/objectif/Objectif.interface.ts`
- `src/server/domain/chantier/décisionStratégique/DécisionStratégique.interface.ts`
- `src/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface.ts`

### 3. Mapping dans les queries

Dans chaque query, propager les nouveaux champs depuis le résultat Prisma vers l'objet domaine. La résolution du service se fait au niveau du mapping — l'interface domaine expose toujours la valeur effective :

```typescript
const resoudreService = (service: string | null, serviceAutre: string | null): string | null =>
  service === "autre" ? serviceAutre : service;
```

Les champs exposés dans l'interface sont donc `auteurCreationService` (valeur résolue) et `auteurCreationFonction`, sans jamais exposer `service_autre` aux couches supérieures.

### 4. Interface client Publication

`src/client/components/PageChantier/PublicationV2/Publication.interface.ts` :

```typescript
export interface Publication {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;     // nouveau
  auteurCreationFonction: string | null;    // nouveau
  auteurModificationNom: string;
  auteurModificationService: string | null; // nouveau
  auteurModificationFonction: string | null; // nouveau
}
```

### 5. PVA — PrismaIndicateurRepository

Ajouter `service: true` et `service_autre: true` au select de `auteur` (lignes 891-896 environ) :

```typescript
auteur: {
  select: {
    nom: true,
    prenom: true,
    service: true,       // nouveau
    service_autre: true, // nouveau
  },
},
```

### 6. Interface domaine PVA

`src/server/chantiers/domain/DetailsIndicateurs.ts` — ajouter dans `DetailIndicateurPropositionValeurAvancement` :

```typescript
auteurService: string | null; // nouveau — valeur résolue (service_autre si service === "autre")
```

Et propager dans `recupererPropositionValeurAvancement` en appliquant la même résolution :

```typescript
auteur: `${auteur.prenom} ${auteur.nom}`,
auteurService: auteur.service === "autre" ? auteur.service_autre ?? null : auteur.service ?? null, // nouveau
```

---

## Nouveau composant partagé

### `NomUtilisateurAvecTooltip`

**Emplacement** : `src/client/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip.tsx`

**Props** :

```typescript
interface NomUtilisateurAvecTooltipProps {
  nom: string;
  service: string | null;
  fonction: string | null;
  className?: string;
}
```

**Comportement** :
- Rend le nom dans un `<span>` avec `ref` et handlers `onMouseEnter`/`onMouseLeave`.
- Affiche toujours un `SecureTooltip` au survol — même si `service` et `fonction` sont tous les deux null.
- Contenu du tooltip :

```
Service : Nom du service     (ou "Non renseigné" si null)
Fonction : Nom de la fonction (ou "Non renseigné" si null)
```

**Implémentation** :

```tsx
const NomUtilisateurAvecTooltip = ({ nom, service, fonction, className }: NomUtilisateurAvecTooltipProps) => {
  const [visible, setVisible] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        ref={anchorRef}
        className={clsxm("cursor-help underline decoration-dotted", className)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {nom}
      </span>
      <SecureTooltip
        anchorEl={anchorRef.current}
        classNameInfoBulle="!min-w-0 !max-w-[300px]"
        isVisible={visible}
      >
        <p className="text-sm mb-0">
          <span className="font-semibold">Service : </span>
          {service ?? "Non renseigné"}
        </p>
        <p className="text-sm mb-0">
          <span className="font-semibold">Fonction : </span>
          {fonction ?? "Non renseigné"}
        </p>
      </SecureTooltip>
    </>
  );
};
```

---

## Modifications frontend

### AffichagePublication.tsx

La template string de métadonnée doit être découpée en JSX pour rendre les noms de façon hoverable.

**Avant** :
```tsx
<p>
  {commentaire.dateCreation === commentaire.dateModification
    ? `Publié le ${...} | Par ${commentaire.auteurCreationNom}`
    : `Publié le ${...} par ${commentaire.auteurCreationNom} et modifié le ${...} par ${commentaire.auteurModificationNom}`}
</p>
```

**Après** : deux blocs JSX conditionnels avec `<NomUtilisateurAvecTooltip>` en lieu et place des noms.

Exemple pour le cas "non modifié" :
```tsx
<p>
  Publié le {PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateCreation)} | Par{" "}
  <NomUtilisateurAvecTooltip
    nom={commentaire.auteurCreationNom}
    service={commentaire.auteurCreationService}
    fonction={commentaire.auteurCreationFonction}
  />
</p>
```

Même pattern pour le cas "modifié", avec les deux `NomUtilisateurAvecTooltip` (création + modification).

### CelluleStatutProposition.tsx

Dans le cas où la proposition est en cours (bloc `else` du `infoBulle`), enrichir l'affichage inline de l'auteur :

**Avant** :
```tsx
<p>Valeur d'avancement proposée le {formaterDate(...)} par {proposition.auteur}</p>
```

**Après** :
```tsx
<p>
  Valeur d'avancement proposée le {formaterDate(...)} par {proposition.auteur}
  {proposition.auteurService ? ` (${proposition.auteurService})` : ""}
</p>
```

Pas de hover, pas de composant partagé ici — texte inline uniquement, dans l'infobulle déjà existante.

---

## Cas limites

| Cas | Comportement |
|---|---|
| `service` et `fonction` tous les deux null | Tooltip affiché, les deux lignes affichent "Non renseigné" |
| Un seul des deux null | Tooltip affiché, la ligne manquante affiche "Non renseigné" |
| `service === "autre"` | La valeur résolue au backend est `service_autre` — le frontend reçoit directement la valeur finale |
| Auteur création = auteur modification | Un seul nom affiché (cas déjà géré), un seul tooltip |
| PVA : `auteurService` null | Le service entre parenthèses n'est pas rendu |

---

## Plan d'implémentation

### Étape 1 — Étendre les queries publications (4 fichiers identiques)

Pour chacun des 4 fichiers :
- `src/server/commentaires/queries/RecupererDernierCommentaireQuery.ts`
- `src/server/objectifs/queries/RecupererDerniersObjectifsQuery.ts`
- `src/server/decisions-strategiques/queries/RecupererDerniereDecisionStrategiqueQuery.ts`
- `src/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery.ts`

Actions :
- Ajouter `service: true, service_autre: true, fonction: true` dans le `select` de `auteur_creation` et `auteur_modification`
- Dans le mapping vers l'objet domaine, calculer la valeur résolue avec `service === "autre" ? service_autre : service` pour `auteurCreationService` et `auteurModificationService`

### Étape 2 — Étendre les interfaces domaine publications (4 fichiers identiques)

Pour chacun des 4 fichiers :
- `src/server/domain/chantier/commentaire/Commentaire.interface.ts`
- `src/server/domain/chantier/objectif/Objectif.interface.ts`
- `src/server/domain/chantier/décisionStratégique/DécisionStratégique.interface.ts`
- `src/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface.ts`

Actions :
- Ajouter `auteurCreationService`, `auteurCreationFonction`, `auteurModificationService`, `auteurModificationFonction` (`string | null`) dans l'interface `AvecNomsAuteurs` correspondante

### Étape 3 — Étendre l'interface client Publication

Fichier : `src/client/components/PageChantier/PublicationV2/Publication.interface.ts`

Actions :
- Ajouter `auteurCreationService`, `auteurCreationFonction`, `auteurModificationService`, `auteurModificationFonction` (`string | null`)
- Vérifier que tous les endroits qui construisent un objet `Publication` (mappers entre domaine et contrat tRPC) propagent les nouveaux champs — corriger les erreurs TypeScript qui remontent

### Étape 4 — Étendre la query et l'interface PVA

Fichier repository : `src/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository.ts`
- Ajouter `service: true, service_autre: true` dans le `select` de `auteur` (vers ligne 891)

Fichier interface : `src/server/chantiers/domain/DetailsIndicateurs.ts`
- Ajouter `auteurService: string | null` dans `DetailIndicateurPropositionValeurAvancement`

Dans la méthode `recupererPropositionValeurAvancement` :
- Propager `auteurService` en appliquant la résolution `service === "autre" ? service_autre : service`

### Étape 5 — Créer le composant `NomUtilisateurAvecTooltip`

Fichier à créer : `src/client/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip.tsx`

Actions :
- Implémenter le composant selon la spec ci-dessus (span + SecureTooltip, hover state interne, affichage toujours actif)
- Exporter le composant

### Étape 6 — Mettre à jour `AffichagePublication`

Fichier : `src/client/components/PageChantier/PublicationV2/Affichage/AffichagePublication.tsx`

Actions :
- Remplacer la template string de la ligne métadonnée par deux blocs JSX conditionnels (cas "non modifié" / cas "modifié")
- Insérer `<NomUtilisateurAvecTooltip>` à la place de chaque nom d'auteur, en passant les champs `service` et `fonction` correspondants

### Étape 7 — Mettre à jour `CelluleStatutProposition`

Fichier : `src/client/components/_commons/IndicateursChantier/Bloc/CelluleStatutProposition.tsx`

Actions :
- Dans le bloc `else` (proposition en cours), enrichir le paragraphe auteur en ajoutant `{proposition.auteurService ? ` (${proposition.auteurService})` : ""}` après `{proposition.auteur}`
- Vérifier que le type `DetailIndicateurPropositionValeurAvancement` est bien mis à jour (étape 4) pour que TypeScript valide la prop `auteurService`
