import { FunctionComponent } from "react";
import { wording } from "@/client/utils/i18n/i18n";
import Alerte from "@/components/_commons/Alerte/Alerte";
import {
  Tableau,
  TableauCellule,
  TableauCelluleEnTete,
  TableauCorps,
  TableauEnTete,
  TableauLigne,
} from "@/components/shared/Tableau";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";

interface ResultatValidationFichierProps {
  rapport: DetailValidationFichierContrat;
}

const ResultatValidationFichier: FunctionComponent<
  ResultatValidationFichierProps
> = ({ rapport }) => {
  const contientDesErreursNonIdentifies = rapport.listeErreursValidation.some(
    (erreur) => erreur.nom === "Erreur non identifié",
  );

  return (
    <section className="fr-my-2w">
      {rapport.estValide ? (
        <Alerte
          message={
            wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
              .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_SUCCES
          }
          titre={
            wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
              .ETAPE_CHARGER_FICHIER.TITRE_ALERT_SUCCES
          }
          type="succès"
        />
      ) : (
        <div>
          {contientDesErreursNonIdentifies ? (
            <Alerte
              message={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR_SUPPORT
              }
              titre={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR_SUPPORT
              }
              type="erreur"
            />
          ) : (
            <Alerte
              message={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR
              }
              titre={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR
              }
              type="erreur"
            />
          )}
          <h5 className="fr-mt-3w">
            Rapport d'erreur de la validation du fichier
          </h5>
          <Tableau>
            <TableauEnTete>
              <tr>
                <TableauCelluleEnTete>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM
                  }
                </TableauCelluleEnTete>
                <TableauCelluleEnTete>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.CELLULE
                  }
                </TableauCelluleEnTete>
                <TableauCelluleEnTete>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.MESSAGE
                  }
                </TableauCelluleEnTete>
                <TableauCelluleEnTete>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM_DU_CHAMP
                  }
                </TableauCelluleEnTete>
                <TableauCelluleEnTete>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE
                      .POSITION_DE_LIGNE
                  }
                </TableauCelluleEnTete>
              </tr>
            </TableauEnTete>
            <TableauCorps>
              {rapport.listeErreursValidation.map((erreur) => {
                return (
                  <TableauLigne
                    key={`${erreur.cellule}-${erreur.numeroDeLigne}-${erreur.positionDeLigne}`}
                  >
                    <TableauCellule>{erreur.nom}</TableauCellule>
                    <TableauCellule>{erreur.cellule}</TableauCellule>
                    <TableauCellule>{erreur.message}</TableauCellule>
                    <TableauCellule>{erreur.nomDuChamp}</TableauCellule>
                    <TableauCellule>{erreur.positionDeLigne}</TableauCellule>
                  </TableauLigne>
                );
              })}
            </TableauCorps>
          </Tableau>
        </div>
      )}
    </section>
  );
};

export default ResultatValidationFichier;
