-- Renommage du concept "panier" → "collection" (étape 2/3 : copie des données).
-- Copie l'intégralité des tables panier_* vers les tables collection_* créées à
-- l'étape précédente. Le public_id est transformé de PAN-XXX vers COL-XXX pour
-- rester cohérent avec le nouveau schéma de validation (`COL-…`).
-- L'ordre respecte les contraintes de clés étrangères (table racine en premier).

-- collection (table racine)
INSERT INTO "collection" ("id", "public_id", "nom", "description", "visibilite", "created_at", "updated_at")
SELECT "id", regexp_replace("public_id", '^PAN-', 'COL-'), "nom", "description", "visibilite", "created_at", "updated_at"
FROM "panier";

-- collection_permission
INSERT INTO "collection_permission" ("principal_id", "collection_id", "action", "created_at")
SELECT "principal_id", "panier_id", "action", "created_at"
FROM "panier_permission";

-- collection_indicateur
INSERT INTO "collection_indicateur" ("collection_id", "indicateur_id", "ponderation", "created_at")
SELECT "panier_id", "indicateur_id", "ponderation", "created_at"
FROM "panier_indicateur";

-- collection_responsable
INSERT INTO "collection_responsable" ("collection_id", "utilisateur_id", "created_at")
SELECT "panier_id", "utilisateur_id", "created_at"
FROM "panier_responsable";

-- collection_contact_utile
INSERT INTO "collection_contact_utile" ("collection_id", "contact_utile_id", "created_at")
SELECT "panier_id", "contact_utile_id", "created_at"
FROM "panier_contact_utile";

-- collection_commentaire (cast de l'enum panier_* vers collection_*, mêmes valeurs)
INSERT INTO "collection_commentaire" ("commentaire_id", "collection_id", "type")
SELECT "commentaire_id", "panier_id", "type"::text::"collection_commentaire_type_enum"
FROM "panier_commentaire";
