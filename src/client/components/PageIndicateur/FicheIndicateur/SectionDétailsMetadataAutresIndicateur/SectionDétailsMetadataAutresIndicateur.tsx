import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurInput } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInput";
import { MetadataIndicateurTextArea } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurTextArea";
import { MetadataIndicateurInterrupteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInterrupteur";
import { MetadataIndicateurSelecteur } from "@/client/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur";
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from "@/client/components/PageIndicateur/FicheIndicateur/commons/utils";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

const SectionDétailsMetadataAutresIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const {
    register,
    formState: { errors },
  } = useMetadataIndicateurForm();
  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Autres informations
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="mailles"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.mailles
            }
            valeurAffiché={indicateur.mailles || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="frequenceTerritoriale"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.frequence_territoriale
            }
            valeurAffiché={`${indicateur.frequenceTerritoriale}`}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="adminSource"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.admin_source
            }
            valeurAffiché={indicateur.adminSource || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="siSource"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.si_source
            }
            valeurAffiché={indicateur.siSource || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="donneeOuverte"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.donnee_ouverte
            }
            valeurAffiché={indicateur.donneeOuverte ? "Oui" : "Non"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="modalitesDonneeOuverte"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.modalites_donnee_ouverte
            }
            valeurAffiché={indicateur.modalitesDonneeOuverte || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="respDonnees"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.resp_donnees
            }
            valeurAffiché={indicateur.respDonnees || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="respDonneesEmail"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.resp_donnees_email
            }
            valeurAffiché={indicateur.respDonneesEmail || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="contactTechnique"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.contact_technique
            }
            valeurAffiché={indicateur.contactTechnique || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="contactTechniqueEmail"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.contact_technique_email
            }
            valeurAffiché={indicateur.contactTechniqueEmail || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicIsPerseverant"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_perseverant
            }
            valeurAffiché={indicateur.indicIsPerseverant ? "Oui" : "Non"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="reformePrioritaire"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.reforme_prioritaire
            }
            valeurAffiché={indicateur.reformePrioritaire || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="projetAnnuelPerf"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.projet_annuel_perf
            }
            valeurAffiché={indicateur.projetAnnuelPerf ? "Oui" : "Non"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="detailProjetAnnuelPerf"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.detail_projet_annuel_perf
            }
            valeurAffiché={indicateur.detailProjetAnnuelPerf || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurTextArea
            erreurMessage={errors.commentaire?.message}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="commentaire"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.commentaire
            }
            register={register("commentaire", {
              value: indicateur?.commentaire,
            })}
            valeurAffiché={indicateur.commentaire || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="methodeCollecte"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.methode_collecte
            }
            valeurAffiché={indicateur.methodeCollecte || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.maille_pilotage
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "maille_pilotage",
            )}
            name="maillePilotage"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "maille_pilotage",
              "maillePilotage",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.couverture_temporelle
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "couverture_temporelle",
            )}
            name="couvertureTemporelle"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "couverture_temporelle",
              "couvertureTemporelle",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="cibleAttendue"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.cible_attendue
            }
            valeurAffiché={indicateur.cibleAttendue ? "Oui" : "Non"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicIsPhare"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_phare
            }
            valeurAffiché={indicateur.indicIsPhare ? "Oui" : "Non"}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataAutresIndicateur;
