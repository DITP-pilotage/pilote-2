import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";

const SectionDétailsMetadataAutresIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Autres informations
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.mailles
            }
            name="mailles"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.frequence_territoriale
            }
            name="frequenceTerritoriale"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.admin_source
            }
            name="adminSource"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.si_source
            }
            name="siSource"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.donnee_ouverte
            }
            name="donneeOuverte"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.modalites_donnee_ouverte
            }
            name="modalitesDonneeOuverte"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.resp_donnees
            }
            name="respDonnees"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.resp_donnees_email
            }
            name="respDonneesEmail"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.contact_technique
            }
            name="contactTechnique"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.contact_technique_email
            }
            name="contactTechniqueEmail"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_perseverant
            }
            name="indicIsPerseverant"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.reforme_prioritaire
            }
            name="reformePrioritaire"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.projet_annuel_perf
            }
            name="projetAnnuelPerf"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.detail_projet_annuel_perf
            }
            name="detailProjetAnnuelPerf"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.commentaire
            }
            name="commentaire"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.methode_collecte
            }
            name="methodeCollecte"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.maille_pilotage
            }
            name="maillePilotage"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.couverture_temporelle
            }
            name="couvertureTemporelle"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.cible_attendue
            }
            name="cibleAttendue"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_phare
            }
            name="indicIsPhare"
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataAutresIndicateur;
