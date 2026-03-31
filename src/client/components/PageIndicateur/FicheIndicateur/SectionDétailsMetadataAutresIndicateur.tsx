import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataChamp } from "@/components/_commons/MetadataChamp/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import {
  computeValeurAffichee,
  computeListeValeur,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

const SectionDétailsMetadataAutresIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
}) => {
  const form = useMetadataIndicateurForm();

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Autres informations
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.mailles}
            name="mailles"
            valeurAffichee={computeValeurAffichee(
              mapInfo.mailles,
              indicateur,
              "mailles",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.frequence_territoriale}
            name="frequenceTerritoriale"
            valeurAffichee={computeValeurAffichee(
              mapInfo.frequence_territoriale,
              indicateur,
              "frequenceTerritoriale",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.admin_source}
            name="adminSource"
            valeurAffichee={computeValeurAffichee(
              mapInfo.admin_source,
              indicateur,
              "adminSource",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.si_source}
            name="siSource"
            valeurAffichee={computeValeurAffichee(
              mapInfo.si_source,
              indicateur,
              "siSource",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.donnee_ouverte}
            name="donneeOuverte"
            valeurAffichee={computeValeurAffichee(
              mapInfo.donnee_ouverte,
              indicateur,
              "donneeOuverte",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.modalites_donnee_ouverte}
            name="modalitesDonneeOuverte"
            valeurAffichee={computeValeurAffichee(
              mapInfo.modalites_donnee_ouverte,
              indicateur,
              "modalitesDonneeOuverte",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.resp_donnees}
            name="respDonnees"
            valeurAffichee={computeValeurAffichee(
              mapInfo.resp_donnees,
              indicateur,
              "respDonnees",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.resp_donnees_email}
            name="respDonneesEmail"
            valeurAffichee={computeValeurAffichee(
              mapInfo.resp_donnees_email,
              indicateur,
              "respDonneesEmail",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.contact_technique}
            name="contactTechnique"
            valeurAffichee={computeValeurAffichee(
              mapInfo.contact_technique,
              indicateur,
              "contactTechnique",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.contact_technique_email}
            name="contactTechniqueEmail"
            valeurAffichee={computeValeurAffichee(
              mapInfo.contact_technique_email,
              indicateur,
              "contactTechniqueEmail",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_is_perseverant}
            name="indicIsPerseverant"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_is_perseverant,
              indicateur,
              "indicIsPerseverant",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.reforme_prioritaire}
            name="reformePrioritaire"
            valeurAffichee={computeValeurAffichee(
              mapInfo.reforme_prioritaire,
              indicateur,
              "reformePrioritaire",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.projet_annuel_perf}
            name="projetAnnuelPerf"
            valeurAffichee={computeValeurAffichee(
              mapInfo.projet_annuel_perf,
              indicateur,
              "projetAnnuelPerf",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.detail_projet_annuel_perf}
            name="detailProjetAnnuelPerf"
            valeurAffichee={computeValeurAffichee(
              mapInfo.detail_projet_annuel_perf,
              indicateur,
              "detailProjetAnnuelPerf",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="textarea"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.commentaire}
            name="commentaire"
            valeurAffichee={computeValeurAffichee(
              mapInfo.commentaire,
              indicateur,
              "commentaire",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.methode_collecte}
            name="methodeCollecte"
            valeurAffichee={computeValeurAffichee(
              mapInfo.methode_collecte,
              indicateur,
              "methodeCollecte",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.maille_pilotage}
            listeValeur={computeListeValeur(mapInfo.maille_pilotage)}
            name="maillePilotage"
            valeurAffichee={computeValeurAffichee(
              mapInfo.maille_pilotage,
              indicateur,
              "maillePilotage",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.couverture_temporelle}
            listeValeur={computeListeValeur(mapInfo.couverture_temporelle)}
            name="couvertureTemporelle"
            valeurAffichee={computeValeurAffichee(
              mapInfo.couverture_temporelle,
              indicateur,
              "couvertureTemporelle",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.cible_attendue}
            name="cibleAttendue"
            valeurAffichee={computeValeurAffichee(
              mapInfo.cible_attendue,
              indicateur,
              "cibleAttendue",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_is_phare}
            name="indicIsPhare"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_is_phare,
              indicateur,
              "indicIsPhare",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataAutresIndicateur;
