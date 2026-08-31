import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from "@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface";
import { ErreurValidationFichier } from "@/server/import-indicateur/domain/ErreurValidationFichier";
import logger from "@/server/infrastructure/Logger";
import { chargerSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import { parserFichier } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser";
import {
  validerContraintesDeChamp,
  detecterViolationsClePrimaire,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator";
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";
import { supprimerLeFichier } from "@/server/import-indicateur/infrastructure/adapters/FichierService";

const creerErreurEnTete = (
  rapportId: string,
  message: string,
): ErreurValidationFichier =>
  ErreurValidationFichier.creerErreurValidationFichier({
    rapportId,
    cellule: "Cellule non définie",
    nom: "En-tête incorrect",
    message,
    numeroDeLigne: 0,
    positionDeLigne: 0,
    nomDuChamp: "",
    positionDuChamp: 0,
  });

const construireErreurDepuisViolation = (
  rapportId: string,
  violation: ViolationContrainte,
  entetes: string[],
  schema: TableSchema,
): ErreurValidationFichier =>
  ErreurValidationFichier.creerErreurValidationFichier({
    rapportId,
    cellule: violation.cellule,
    nom: violation.type,
    message: genererMessageErreur(violation, schema),
    numeroDeLigne: violation.ligneDeDonnees + 2,
    positionDeLigne: violation.ligneDeDonnees,
    nomDuChamp: violation.nomDuChamp,
    positionDuChamp: entetes.indexOf(violation.nomDuChamp),
  });

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

    try {
      const schema = chargerSchema(nomDuSchema);
      const lignes = await parserFichier(cheminCompletDuFichier, nomDuFichier);
      const [enTeteBrute, ...lignesDeDonnees] = lignes;
      const entetes = enTeteBrute.map((entete) => entete.trim());
      const entetesNormalisees = entetes.map((entete) => entete.toLowerCase());

      const listeErreursValidation: ErreurValidationFichier[] = [];

      enTeteBrute.forEach((entete) => {
        if (entete.trim() !== entete) {
          listeErreursValidation.push(
            creerErreurEnTete(
              rapport.id,
              `Le champ de l'en-tête '${entete.trim()}' comporte des espaces, veuillez les supprimer`,
            ),
          );
        }
        if (entete.toLowerCase() !== entete) {
          listeErreursValidation.push(
            creerErreurEnTete(
              rapport.id,
              `Le champ de l'en-tête '${entete.toLowerCase()}' comporte des majuscules, veuillez les mettre en minuscule`,
            ),
          );
        }
      });

      const contientDoublons =
        new Set(entetesNormalisees).size !== entetesNormalisees.length;
      const contientTousLesChamps = schema.fields.every((champ) =>
        entetesNormalisees.includes(champ.name),
      );

      let listeIndicateursData: MesureIndicateurTemporaire[] = [];

      if (!entetesNormalisees.includes("identifiant_indic")) {
        listeErreursValidation.push(
          creerErreurEnTete(
            rapport.id,
            "L'en-tête identifiant_indic n'est pas présente",
          ),
        );
      } else if (contientDoublons) {
        listeErreursValidation.push(
          creerErreurEnTete(
            rapport.id,
            "Il existe des entêtes en doublon dans le fichier",
          ),
        );
      } else if (!contientTousLesChamps) {
        listeErreursValidation.push(
          creerErreurEnTete(
            rapport.id,
            `Les en-têtes du fichier sont invalides, les en-têtes doivent être [${schema.fields
              .map((champ) => champ.name)
              .join(", ")}]`,
          ),
        );
      } else {
        const violations = [
          ...validerContraintesDeChamp(
            schema,
            entetesNormalisees,
            lignesDeDonnees,
          ),
          ...detecterViolationsClePrimaire(
            schema,
            entetesNormalisees,
            lignesDeDonnees,
          ),
        ];

        violations.forEach((violation) => {
          listeErreursValidation.push(
            construireErreurDepuisViolation(
              rapport.id,
              violation,
              entetesNormalisees,
              schema,
            ),
          );
        });

        listeIndicateursData = lignesDeDonnees.map((ligne) =>
          MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
            rapportId: rapport.id,
            indicId:
              ligne[entetesNormalisees.indexOf("identifiant_indic")] ?? null,
            zoneId: ligne[entetesNormalisees.indexOf("zone_id")] ?? null,
            metricDate:
              ligne[entetesNormalisees.indexOf("date_valeur")] ?? null,
            metricType:
              ligne[entetesNormalisees.indexOf("type_valeur")] ?? null,
            metricValue: `${ligne[entetesNormalisees.indexOf("valeur")] ?? ""}`,
          }),
        );
      }

      rapport.affecterListeMesuresIndicateurTemporaire(listeIndicateursData);
      rapport.affecterListeErreursValidation(listeErreursValidation);

      return DetailValidationFichier.creerDetailValidationFichier({
        id: rapport.id,
        dateCreation: rapport.dateCreation,
        estValide: listeErreursValidation.length === 0,
        utilisateurEmail,
        listeErreursValidation: rapport.listeErreursValidation,
        listeMesuresIndicateurTemporaire:
          rapport.listeMesuresIndicateurTemporaire,
      });
    } catch (error) {
      logger.error(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          utilisateurEmail,
        },
        (error as Error).message,
      );

      rapport.affecterListeErreursValidation([
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: rapport.id,
          cellule: "Cellule non définie",
          nom: "Erreur non identifié",
          message:
            "Une erreur est survenue lors de la validation de la forme du fichier",
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: "",
          positionDuChamp: 0,
        }),
      ]);

      return rapport;
    } finally {
      supprimerLeFichier(cheminCompletDuFichier);
    }
  }
}
