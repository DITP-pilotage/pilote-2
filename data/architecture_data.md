# Schéma des flux de données

Ce document souhaite poser les bases des flux de données alimentant l'application [Pilote 2](). @Fabien ajouter lien vers l'app

L'évolution de ces flux se fera au fur et à mesure de la création de l'application Pilote 2.

## Schéma macro des flux

``` mermaid
graph LR
SFTP(Chargement initial) --> PG[(Base PG Pilote 2)]
PM(PPG_metadata) --> PG
RB(referentiel-builder) --> PG
PG --> BE(Back-end) --> FE(Front-end)

```

## Zoom sur la partie ingestion de données 
### Brique SFTP vers Datawarehouse

Aujourd'hui, le chargement des données se fait manuellement une seule fois.
A terme nous devons pouvoir charger les données du serveur SFTP.

``` mermaid
graph LR
SFTP(Chargement initial) --> |chantier_perseverant.csv| PG[(Base PG Pilote 2)]
```

Légende : 
- Est appelé `Chargement initial` les données (ou .csv) issues du _SFTP_.
- Est appelé `chantier_perseverant.csv` le fichier `DITP_Liste_chantiers_perseverants-avec-trigramme.csv`.

### PPG Metadata vers Datawarehouse

Pour le moment aucun pipeline de données n'a été implémentée. On peut imaginer des flux suivants :

``` mermaid
graph LR
PM(PPG_metadata) --> PG[(Base PG Pilote 2)]
```

### Referentiel-builder vers Datawarehouse

Pour le moment aucun pipeline de données n'a été implémentée. On peut imaginer des flux suivants :

``` mermaid
graph LR
RB(referentiel-builder) --> PG[(Base PG Pilote 2)]
```


## Zoom sur la partie transformation de données

Dans cette brique datawarehouse, deux schémas de données se distinguent : 
- Les données brutes ou `raw_data` qui sont situées dans le schéma `raw_data`. 
- Les données transformées et agrégées ou 'ready to use data' qui sont situées dans le schéma `public`.

Il faudrait également mener une réflexion sur la pertinence d'avoir un schéma de données pour les données nettoyées et 
pré-processées.

``` mermaid
graph LR
subgraph Base PG Pilote 2
    RD{{raw_data}} --> |chantier| J((J))
    RD --> |perimetre_ministeriel| J
    J --> |chantier| PU{{public}}
end

subgraph Légende
    SCH{{schéma}}
    JOIN((Jointure))
end
```

NB: Ce schéma n'est pas encore implémenté mais cela permet de poser des conventions de documentation des flux de données à l'intérieur de la base Pilote 2.
