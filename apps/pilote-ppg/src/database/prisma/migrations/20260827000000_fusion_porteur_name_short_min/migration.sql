-- Fusion de porteur_name_short dans porteur_name/porteur_desc pour les porteurs MIN
-- porteur_name (ancien, nom officiel complet) -> porteur_desc (écrase toute description existante)
-- porteur_name_short (ancien, nom affichable) -> porteur_name
-- Si porteur_name_short est NULL pour un MIN, porteur_name reste inchangé (COALESCE)
UPDATE raw_data.metadata_porteurs
SET
  porteur_desc = porteur_name,
  porteur_name = COALESCE(porteur_name_short, porteur_name)
WHERE porteur_type = 'MIN';

ALTER TABLE raw_data.metadata_porteurs
  DROP COLUMN porteur_name_short;
