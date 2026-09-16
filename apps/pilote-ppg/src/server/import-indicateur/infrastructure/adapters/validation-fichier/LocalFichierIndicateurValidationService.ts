import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";
import { ErreurValidationFichier } from "@/server/import-indicateur/domain/ErreurValidationFichier";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import type {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from "@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface";
import { supprimerLeFichier } from "@/server/import-indicateur/infrastructure/adapters/FichierService";
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import { chargerSchemaBrut } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import { lireFichierTabulaire } from "@/server/infrastructure/fichier-tabulaire/lireFichierTabulaire";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";
import logger from "@/server/infrastructure/Logger";
import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import { validerLignes } from "@/server/infrastructure/table-schema/validerLignes";

const COLONNE_IDENTIFIANT = "identifiant_indic";

export class LocalFichierIndicateurValidationService implements FichierIndicateurValidationService {
  async validerFichier({
    cheminCompletDuFichier,
    nomDuFichier,
    schema: nomDuSchema,
    utilisateurEmail,
  }: ValiderFichierPayload): Promise<DetailValidationFichier> {
    const rapport = DetailValidationFichier.creerDetailValidationFichier({
      estValide: false,
      utilisateurEmail,
    });

    const erreurs: ErreurValidationFichier[] = [];
    const erreurDEnTete = (message: string) =>
      ErreurValidationFichier.creerErreurValidationFichier({
        rapportId: rapport.id,
        cellule: "Cellule non définie",
        nom: "En-tête incorrect",
        message,
        numeroDeLigne: 1,
        positionDeLigne: 0,
        nomDuChamp: "",
        positionDuChamp: -1,
      });

    try {
      const fichier = await lireFichierTabulaire(
        cheminCompletDuFichier,
        nomDuFichier,
      );
      const schema = compilerSchema(
        chargerSchemaBrut(nomDuSchema),
        fichier.entetes,
      );

      logger.info(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          producteur: fichier.producteur,
          schema: nomDuSchema,
          nombreLignes: fichier.lignes.length,
        },
        "Lecture du fichier d'import",
      );

      const normalisees = fichier.entetes.map((entete) =>
        entete.trim().toLowerCase(),
      );

      // Validata ne signale ni les espaces ni les majuscules dans l'en-tête :
      // ces deux contrôles sont propres à l'application (mesuré le 2026-09-16).
      for (const entete of fichier.entetes) {
        if (entete.trim() !== entete) {
          erreurs.push(
            erreurDEnTete(
              `Le champ de l'en-tête '${entete.trim()}' comporte des espaces, veuillez les supprimer`,
            ),
          );
        }
        if (entete.toLowerCase() !== entete) {
          erreurs.push(
            erreurDEnTete(
              `Le champ de l'en-tête '${entete.toLowerCase()}' comporte des majuscules, veuillez les mettre en minuscule`,
            ),
          );
        }
      }

      if (new Set(normalisees).size !== normalisees.length) {
        erreurs.push(
          erreurDEnTete("Il existe des entêtes en doublon dans le fichier"),
        );
      }

      const indexIdentifiant = normalisees.indexOf(COLONNE_IDENTIFIANT);

      if (indexIdentifiant === -1) {
        erreurs.push(
          erreurDEnTete("L'en-tête identifiant_indic n'est pas présente"),
        );
      } else {
        // Une colonne de clé primaire absente est bloquante, là où une colonne
        // ordinaire absente est simplement ignorée (schema_sync).
        for (const colonne of schema.colonnesClePrimaireAbsentes) {
          erreurs.push(
            erreurDEnTete(`L'en-tête ${colonne} n'est pas présente`),
          );
        }

        const { violations, tronque } = validerLignes(schema, fichier.lignes);

        for (const violation of violations) {
          const numeroDeLigne =
            fichier.numerosDeLigneSource[violation.indexDeLigne];
          erreurs.push(
            ErreurValidationFichier.creerErreurValidationFichier({
              rapportId: rapport.id,
              cellule: violation.cellule ?? "Cellule non définie",
              nom: violation.type,
              message: genererMessageErreur(violation, schema, numeroDeLigne),
              numeroDeLigne,
              positionDeLigne: violation.indexDeLigne,
              nomDuChamp: violation.nomDuChamp ?? "",
              positionDuChamp: violation.indexDeColonne,
            }),
          );
        }

        if (tronque) {
          erreurs.push(
            erreurDEnTete(
              "Le fichier comporte trop d'erreurs pour être analysé en entier. Corrigez celles qui sont listées, puis relancez la vérification.",
            ),
          );
        }

        const index = (nom: string) => normalisees.indexOf(nom);
        rapport.affecterListeMesuresIndicateurTemporaire(
          fichier.lignes.map((ligne) =>
            MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
              rapportId: rapport.id,
              indicId: ligne[indexIdentifiant] ?? null,
              zoneId: ligne[index("zone_id")] ?? null,
              metricDate: ligne[index("date_valeur")] ?? null,
              metricType: ligne[index("type_valeur")] ?? null,
              metricValue: `${ligne[index("valeur")] ?? ""}`,
            }),
          ),
        );
      }

      rapport.affecterListeErreursValidation(erreurs);

      return DetailValidationFichier.creerDetailValidationFichier({
        id: rapport.id,
        dateCreation: rapport.dateCreation,
        estValide: erreurs.length === 0,
        utilisateurEmail,
        listeErreursValidation: rapport.listeErreursValidation,
        listeMesuresIndicateurTemporaire:
          rapport.listeMesuresIndicateurTemporaire,
      });
    } catch (erreur) {
      const illisible = erreur instanceof FichierTabulaireIllisibleError;

      logger.error(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          utilisateurEmail,
          raison: illisible ? erreur.raison : "inattendue",
        },
        (erreur as Error).message,
      );

      rapport.affecterListeErreursValidation([
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: rapport.id,
          cellule: "Cellule non définie",
          nom: illisible ? erreur.raison : "Erreur non identifié",
          message: illisible
            ? erreur.message
            : "Une erreur est survenue lors de la validation de la forme du fichier",
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: "",
          positionDuChamp: -1,
        }),
      ]);

      return rapport;
    } finally {
      supprimerLeFichier(cheminCompletDuFichier);
    }
  }
}
