export const wordingFr = {
  PAGE_IMPORT_MESURE_INDICATEUR: {
    SECTION_EXPLICATION_ETAPE_IMPORT : {
      TITRE: '3 étapes pour mettre à jour vos données',
      ETAPE_SELECTION_INDICATEUR: {
        TITRE: 'Sélectionner l’indicateur',
        SOUS_TITRE_SELECTEUR: 'Sélectionnez l’indicateur',
        TEXTE: 'Sélectionnez l’indicateur que vous souhaitez mettre à jour et cliquez sur le bouton “suivant”. Vous pourrez ensuite télécharger le modèle à remplir ou adapter votre fichier au formalisme demandé. ',
      },
      ETAPE_CHARGER_FICHIER: {
        TITRE: 'Charger le fichier',
        SOUS_TITRE_SELECTEUR: 'Charger le fichier',
        TEXTE: 'Dès que votre fichier vous semble correct, vous pouvez le charger pour vérifier que les données sont au bon format. Un rapport d’erreurs vous renseignera sur les potentiels éléments à adapter.',
      },
      ETAPE_PUBLIER_FICHIER: {
        TITRE: 'Transmettre les données pour publication',
        SOUS_TITRE_SELECTEUR: 'Transmettre les données pour publication',
        TEXTE: 'Prévisualisez vos données et validez la publication. Vous devrez ensuite attendre quelques jours pour que ces données soient prises en compte dans le calcul des taux d’avancement. Vous pouvez mettre à jour d’autres indicateurs.',
      },
    },
    SECTION_ETAPE_IMPORT: {
      TITRE: 'Importez vos données',
      ETAPE_SELECTION_INDICATEUR: {
        TITRE: 'Pour quel indicateur souhaitez-vous mettre à jour les données ?',
        LABEL_BOUTON_VERIFIER_FICHIER: 'Vérifier le fichier',
        LABEL_BOUTON_PROCHAINE_ETAPE: 'Suivant',
        MESSAGE_ERREUR_AUCUN_INDICATEUR: 'Ce chantier ne possède aucun indicateur',
        EXPLICATION_TELECHARGEMENT_TEMPLATE: 'Si vous n’avez pas de fichier au bon format, téléchargez le modèle à remplir et consultez les règles et consignes de remplissage dans les ressources ci-dessous.',
        EXPLICATION_INDICATEUR_ID: 'Le code de cet indicateur à renseigner dans la colonne identifiant_indic est : ',
        LABEL_BOUTON_TELECHARGER_MODELE_CSV: 'Télécharger le modèle csv',
        FORMAT_BOUTON_TELECHARGER_MODELE_CSV: '.csv',
        LABEL_BOUTON_TELECHARGER_MODELE_XLSX: 'Télécharger le modèle xlsx',
        FORMAT_BOUTON_TELECHARGER_MODELE_XLSX: '.xlsx',
      },
      ETAPE_CHARGER_FICHIER: {
        TITRE: 'Vos données doivent être au bon format pour être importées dans PILOTE',
        SOUS_TITRE: 'Si vous avez déjà un fichier en votre possession, chargez votre fichier, nous vous indiquerons s’il est correctement formaté ou s’il doit être adapté.',
        LABEL_BOUTON_CHARGER_FICHIER: (indicateurNom: string) => `Ajouter un fichier pour l’indicateur ${indicateurNom}`,
        LABEL_BOUTON_PROCHAINE_ETAPE: 'Suivant',
        TITRE_ALERT_SUCCES: 'Bravo, le fichier est conforme !',
        MESSAGE_ALERT_SUCCES: 'Passez à l’étape suivante pour prévisualiser les données et confirmer leur publication.',
        TITRE_ALERT_ERREUR: 'Le fichier ne peut pas être importé',
        MESSAGE_ALERT_ERREUR: 'Il contient des erreurs expliquées dans le rapport d’erreurs ci-dessous. Nous vous recommandons de consulter les ressources et/ou de remplir le modèle de fichier à remplir.',
        TABLEAU_ERREUR: {
          ENTETE: {
            NOM: "Type d'erreur",
            CELLULE: 'Cellule',
            MESSAGE: 'Message',
            NOM_DU_CHAMP: 'Nom du champ',
            NUMERO_DE_LIGNE: 'Numéro de ligne',
            POSITION_DE_LIGNE: 'Position de ligne',
            POSITION_DU_CHAMP: 'Position du champ',
          },
        },
      },
      ETAPE_PUBLIER_FICHIER: {
        TITRE: 'Pour quel indicateur souhaitez-vous mettre à jour les données ?',
        TABLEAU_PREVISUALISATION: {
          ENTETE: {
            IDENTIFIANT_INDIC: 'identifiant_indic',
            ZONE_ID: 'zone_id',
            DATE_VALEUR: 'date_valeur',
            TYPE_VALEUR: 'type_valeur',
            VALEUR: 'valeur',
          },
        },
        LABEL_BOUTON_PROCHAINE_ETAPE: 'Transmettre les données',
        TITRE_ALERT_SUCCES: (indicateurId: string) => `Les données ont été importées avec succès pour l’indicateur ${indicateurId}`,
        MESSAGE_ALERT_SUCCES: 'La mise à jour des taux d’avancement sera effective dans 2 heures. Vous pouvez, en attendant, mettre à jour d’autres indicateurs.',
        TITRE_ALERT_ERREUR: 'Le fichier à déjà été importé',
        MESSAGE_BOUTON_RETOUR: 'Importer de nouvelles données',
      },
    },
    SECTION_RESSOURCE: {
      TITRE: 'Ressources',
      SECTION_EXPLICATION_IMPORT: {
        TITRE: 'Comprendre le fichier d’import',
        SOUS_TITRE: 'Pour mettre à jour vos données, vous devrez remplir un modèle d’import avec les champs suivants.',
        LISTE_CHAMPS: {
          IDENTIFIANT_INDIC: {
            CHAMP: 'identifiant_indic',
            EXPLICATION: 'Identifiant unique de l’indicateur. Exemple : IND-001, IND-002, IND-003. (voir identifiant précisé plus haut sur la page)',
          },
          ZONE_ID: {
            CHAMP: 'zone_id',
            EXPLICATION: 'Identifiant du territoire pour lequel la donnée est renseignée. Il provient des référentiels INSEE et est interopérable. Exemple : D34, D20... (voir le référentiel ci-dessous)',
          },
          ZONE_NOM: {
            CHAMP: 'zone_nom',
            EXPLICATION: 'Champ facultatif précisant les territoires auxquels correspondent les zone-id. Vous n’êtes pas obligé(e) d’inclure cette colonne.',
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
            EXPLICATION: 'Valeur de l’indicateur. La valeur doit être numérique. Ne pas saisir de texte (par exemple “NC” ou “non renseigné”)',
          },
        },
        FORMAT_ACCEPTE: 'Les formats acceptés sont csv et xlsx',
        TABLEAU_CHAMPS: {
          ENTETE: {
            IDENTIFIANT_INDIC: 'identifiant_indic',
            ZONE_ID: 'zone_id',
            ZONE_NOM: 'zone_nom (facultatif)',
            DATE_VALEUR: 'date_valeur',
            TYPE_VALEUR: 'type_valeur',
            VALEUR: 'valeur',
          },
          LIGNE_EXEMPLE_1: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D12',
            ZONE_NOM: 'Aveyron',
            DATE_VALEUR: '2023-03-31',
            TYPE_VALEUR: 'va',
            VALEUR: '5',
          },
          LIGNE_EXEMPLE_2: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D13',
            ZONE_NOM: 'Bouches-du-Rhône',
            DATE_VALEUR: '2023-01-17',
            TYPE_VALEUR: 'va',
            VALEUR: '12',
          },
          LIGNE_EXEMPLE_3: {
            IDENTIFIANT_INDIC: 'IND-009',
            ZONE_ID: 'D14',
            ZONE_NOM: 'Calvados',
            DATE_VALEUR: '2023-02-26',
            TYPE_VALEUR: 'va',
            VALEUR: '20',
          },
        },
      },
      SECTION_REFERENTIEL: {
        TITRE: 'Référentiels',
        SOUS_TITRE: 'Consultez les référentiels pour retrouver les codes de tous les territoires (départements, régions, et national). Vous pourrez copier dans ce référentiel les valeurs à indiquer pour les champs zone-id et zone dans le modèle d’import fourni',
        LABEL_BOUTON_TELECHARGER_REFERENTIEL_INDICATEUR: 'Télécharger le référentiel pour les indicateurs  ',
        FORMAT_BOUTON_TELECHARGER_REFERENTIEL_INDICATEUR: 'XLSX – 12 ko',
        LABEL_BOUTON_TELECHARGER_REFERENTIEL_TERRITOIRE: 'Télécharger le référentiel des territoires  ',
        FORMAT_BOUTON_TELECHARGER_REFERENTIEL_TERRITOIRE: 'XLSX – 12 ko',
      },
      SECTION_EXPLICATION_FICHIER: {
        TITRE: 'Comment bien remplir le fichier d’import ?',
        EXPLICATION_FICHIER_1: 'Si vous choisissez le format CSV pour importer les données, veuillez utiliser la virgule (,) pour délimiter les colonnes et les guillemets (") pour délimiter les chaines de caractères',
        EXPLICATION_FICHIER_2: 'Si vous saisissez un taux, la valeur saisie doit se trouver entre 1 et 100. Par exemple, pour 78%, renseignez la valeur 78.',
        EXPLICATION_FICHIER_3: 'L\'encodage du fichier doit être en UTF-8',
        EXPLICATION_FICHIER_4: 'Si vous importez une cellule vide, la valeur précédente sera écrasée (si existante)',
        EXPLICATION_FICHIER_5: 'Toutes les zones du template d\'import ne sont pas nécessaires. Certaines lignes du fichier d\'import peuvent être supprimées. Il n’est ainsi pas nécessaire d’importer la totalité des départements pour chaque mise à jour.',
        EXPLICATION_FICHIER_6: 'Il n\'est pas possible d\'importer plusieurs valeurs pour la même zone, date, identifiant d\'indicateur et type de valeur. Cela générerait une erreur.',
      }, 
      SECTION_CONTACT: {
        MESSAGE_CONTACT: 'Si vous rencontrez des difficultés lors de l’import de votre fichier, merci de nous contacter à l’adresse : ',
        ADRESSE_MAIL: 'support.ditp@modernisation.gouv.fr',
      },
    },
  },
};
