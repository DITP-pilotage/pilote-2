export const SYNTHESE_TERRITOIRE_OUTPUT_FORMAT = `
Tu dois formater ta réponse de synthèse territoriale en suivant exactement ce format :

Synthèse pour {{Nom du territoire}}

Dans Pilote, le TA {{JALON}} de la région s'établit à {{TA_POURCENTAGE_TERRITOIRE}}, pour une médiane nationale à {{TA_POURCENTAGE_NATIONALE}}.

{{X}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale :

{{Liste des chantiers - inclut leur ID, écart, nom, meteo et synthese commentaire}}

{{Y}} chantiers sont compromis ou nécessitent un appui.

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.

Remplace les variables entre {{ }} par les données réelles issues du résultat de l'outil get_synthese_territoire.
`;
