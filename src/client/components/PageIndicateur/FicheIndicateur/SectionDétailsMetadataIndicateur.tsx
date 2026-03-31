import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { MetadataChamp } from "@/components/_commons/MetadataChamp/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { SélecteurOption } from "@/components/_commons/Sélecteur/Sélecteur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import {
  computeValeurAffichee,
  computeListeValeur,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

const SectionDétailsMetadataIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  chantiers: ChantierSynthétisé[];
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
  chantiers,
}) => {
  const form = useMetadataIndicateurForm();

  const { data: metadataIndicateurs = [] } =
    api.metadataIndicateur.récupérerMetadataIndicateurFiltrés.useQuery({
      filtres: {
        chantiers:
          !form.getValues("indicParentCh") ||
          form.getValues("indicParentCh") === "_"
            ? ["Aucun chantier séléctionné"]
            : [form.getValues("indicParentCh")],
        perimetresMinisteriels: [],
        estTerritorialise: false,
        estBarometre: false,
      },
    });

  let optionsIndicateurParent: SélecteurOption<string>[];
  if (
    !form.getValues("indicParentCh") ||
    form.getValues("indicParentCh") === "_"
  ) {
    optionsIndicateurParent = [
      { valeur: "_", libellé: "Selectionner d'abord un chantier" },
    ];
  } else {
    optionsIndicateurParent =
      metadataIndicateurs.length === 0
        ? [
            {
              valeur: "",
              libellé: "Aucun indicateur parent disponible",
            },
          ]
        : [
            {
              valeur: "",
              libellé: "Pas d'indicateur parent",
            },
            ...metadataIndicateurs.map((optionIndicateur) => ({
              valeur: optionIndicateur.indicId,
              libellé: `${optionIndicateur.indicId} ${optionIndicateur.indicNom}`,
            })),
          ];
  }

  const optionsParentCh = [
    ...chantiers.map((chantier) => ({
      valeur: chantier.id,
      libellé: `${chantier.id} - ${chantier.nom}`,
    })),
    { valeur: "_", libellé: "Aucun chantier selectionné" },
  ];

  function displayParentIndic(indicParentIndic: string | null) {
    return indicParentIndic
      ? `${indicParentIndic} - ${metadataIndicateurs.find((metadataIndicateur) => metadataIndicateur.indicId === indicParentIndic)?.indicNom}`
      : "Pas d'indicateur parent";
  }

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="textarea"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_nom}
            name="indicNom"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_nom,
              indicateur,
              "indicNom",
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
            informationMetadata={mapInfo.indic_parent_ch}
            listeValeur={optionsParentCh}
            name="indicParentCh"
            valeurAffichee={`${indicateur.indicParentCh} - ${chantiers.find((chantier) => chantier.id === indicateur.indicParentCh)?.nom}`}
            variante="recherche"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_parent_indic}
            listeValeur={optionsIndicateurParent}
            name="indicParentIndic"
            valeurAffichee={displayParentIndic(indicateur.indicParentIndic)}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="textarea"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_descr}
            name="indicDescr"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_descr,
              indicateur,
              "indicDescr",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="textarea"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_methode_calcul}
            name="indicMethodeCalcul"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_methode_calcul,
              indicateur,
              "indicMethodeCalcul",
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
            informationMetadata={mapInfo.indic_type}
            listeValeur={computeListeValeur(mapInfo.indic_type)}
            name="indicType"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_type,
              indicateur,
              "indicType",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_schema}
            listeValeur={computeListeValeur(mapInfo.indic_schema)}
            name="indicSchema"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_schema,
              indicateur,
              "indicSchema",
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
            informationMetadata={mapInfo.indic_unite}
            name="indicUnite"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_unite,
              indicateur,
              "indicUnite",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.zg_applicable}
            listeValeur={computeListeValeur(mapInfo.zg_applicable)}
            name="zgApplicable"
            valeurAffichee={computeValeurAffichee(
              mapInfo.zg_applicable,
              indicateur,
              "zgApplicable",
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
            informationMetadata={mapInfo.indic_territorialise}
            name="indicTerritorialise"
            onChangeSideEffect={(valeur) => {
              if (!valeur) {
                form.setValue("poidsPourcentDept", "0");
                form.setValue("poidsPourcentReg", "0");
              }
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_territorialise,
              indicateur,
              "indicTerritorialise",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="boolean"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_is_baro}
            name="indicIsBaro"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_is_baro,
              indicateur,
              "indicIsBaro",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            disabled={!form.getValues("indicIsBaro")}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_nom_baro}
            name="indicNomBaro"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_nom_baro,
              indicateur,
              "indicNomBaro",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            disabled={!form.getValues("indicIsBaro")}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_descr_baro}
            name="indicDescrBaro"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_descr_baro,
              indicateur,
              "indicDescrBaro",
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
            informationMetadata={mapInfo.indic_source}
            name="indicSource"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_source,
              indicateur,
              "indicSource",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.indic_source_url}
            name="indicSourceUrl"
            valeurAffichee={computeValeurAffichee(
              mapInfo.indic_source_url,
              indicateur,
              "indicSourceUrl",
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
            informationMetadata={mapInfo.periodicite}
            listeValeur={computeListeValeur(mapInfo.periodicite)}
            name="periodicite"
            valeurAffichee={computeValeurAffichee(
              mapInfo.periodicite,
              indicateur,
              "periodicite",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.delai_disponibilite}
            name="delaiDisponibilite"
            valeurAffichee={computeValeurAffichee(
              mapInfo.delai_disponibilite,
              indicateur,
              "delaiDisponibilite",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataIndicateur;
