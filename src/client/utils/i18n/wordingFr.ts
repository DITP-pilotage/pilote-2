export const wordingFr = {
  PAGE_IMPORT_MESURE_INDICATEUR: {
    SECTION_RESSOURCE: {
      TITRE: 'Ressources',
      SECTION_EXPLICATION_IMPORT: {
        TITRE: 'Comprendre le fichier d’import',
        SOUS_TITRE: 'Pour mettre à jour vos données, vous devrez remplir un modèle d’import avec les champs suivants.',
        LISTE_CHAMPS: {
          IDENTIFIANT_INDIC: {
            CHAMP: 'identifiant_indic',
            EXPLICATION: 'Identifiant unique de l’indicateur. Exemple : IND-001, IND-002, IND-003... (voir le référentiel ci-dessous)',
          },
          ZONE_ID: {
            CHAMP: 'zone_id',
            EXPLICATION: 'Identifiant du territoire pour lequel la donnée est renseignée. Il provient des référentiels INSEE et est interopérable. Exemple : D34, D20... (voir le référentiel ci-dessous)',
          },
          DATE_VALEUR: {
            CHAMP: 'date_valeur',
            EXPLICATION: 'Date à laquelle se réfère la valeur numérique. La date doit être renseignée selon le modèle suivant année-mois-jour. Exemple : 2023-02-26, 2023-01-17...',
          },
          TYPE_VALEUR: {
            CHAMP: 'type_valeur',
            EXPLICATION: 'Type de données insérées : vi pour valeur initiale, va pour valeur actuelle, vc pour valeur cible',
          },
          VALEUR: {
            CHAMP: 'valeur',
            EXPLICATION: 'Valeur de l’indicateur.',
          },
        },
        FORMAT_ACCEPTE: 'Les formats acceptés sont csv et xlsx',
        TABLEAU_CHAMPS: {
          ENTETE: {
            IDENTIFIANT_INDIC: 'identifiant_indic',
            ZONE_ID: 'zone_id',
            DATE_VALEUR: 'date_valeur',
            TYPE_VALEUR: 'type_valeur',
            VALEUR: 'valeur',
          },
          LIGNE_EXEMPLE_1: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D12',
            DATE_VALEUR: '2023-03-31',
            TYPE_VALEUR: 'va',
            VALEUR: '5',
          },
          LIGNE_EXEMPLE_2: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D13',
            DATE_VALEUR: '2023-01-17',
            TYPE_VALEUR: 'va',
            VALEUR: '12',
          },
          LIGNE_EXEMPLE_3: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D14',
            DATE_VALEUR: '2023-02-26',
            TYPE_VALEUR: 'va',
            VALEUR: '20',
          },
        },
      },
      SECTION_REFERENTIEL: {
        TITRE: 'Référentiels',
        SOUS_TITRE: 'Consultez les référentiels pour retrouver l’identifiant de votre indicateur et les codes de tous les territoires (départements, régions, et national).',
        LABEL_TELECHARGEMENT_REFERENTIEL_INDICATEUR: 'Télécharger le référentiel pour les indicateurs  ',
        FORMAT_TELECHARGEMENT_REFERENTIEL_INDICATEUR: 'XLSX – 12 ko',
        LABEL_TELECHARGEMENT_REFERENTIEL_TERRITOIRE: 'Télécharger le référentiel pour les territoires  ',
        FORMAT_TELECHARGEMENT_REFERENTIEL_TERRITOIRE: 'XLSX – 12 ko',
      },
      SECTION_EXPLICATION_FICHIER: {
        TITRE: 'Comment bien remplir le fichier d’import ?',
        EXPLICATION_FICHIER_1: 'Si vous choisissez le format CSV pour importer les données, veuillez utiliser la virgule (,) pour délimiter les colonnes et les guillemets (") pour délimiter les chaines de caractères',
        EXPLICATION_FICHIER_2: 'Si vous choisissez le format xlsx, évitez d’utiliser des formules dans les cellules',
        EXPLICATION_FICHIER_3: 'Si vous saisissez un taux, la valeur saisie doit se trouver entre [0,100] (et non [0,1])',
        EXPLICATION_FICHIER_4: 'Si vous saisissez un nombre avec une décimale, mettez une virgule et non un point',
        EXPLICATION_FICHIER_5: 'L\'encodage du fichier doit être en UTF-8',
        EXPLICATION_FICHIER_6: 'Si vous importez une cellule vide, la valeur précédente sera écrasée (si existante)',
        EXPLICATION_FICHIER_7: 'Toutes les zones du template d\'import ne sont pas nécessaires. Certaines lignes du fichier d\'import peuvent être supprimées. Il n’est ainsi pas nécessaire d’importer la totalité des départements pour chaque mise à jour.',
        EXPLICATION_FICHIER_8: 'Il n\'est pas possible d\'importer plusieurs valeurs pour la même zone, date, identifiant d\'indicateur et type de valeur. Cela générerait une erreur.',
      },
    },
  },
};
