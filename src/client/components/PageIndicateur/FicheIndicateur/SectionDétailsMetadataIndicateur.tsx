import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { MetadataSelecteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataSelecteur";
import { MetadataTextArea } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataTextArea";
import { MetadataInput } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataInput";
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";
import { MetadataInterrupteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataInterrupteur";
import { MetadataSelecteurAvecRecherche } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataSelecteurAvecRecherche";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { SélecteurOption } from "@/components/_commons/Sélecteur/Sélecteur.interface";
import api from "@/server/infrastructure/api/trpc/api";

const SectionDétailsMetadataIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  chantiers: ChantierSynthétisé[];
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
  chantiers,
}) => {
  const { getValues } = useMetadataIndicateurForm();

  const { data: metadataIndicateurs = [] } =
    api.metadataIndicateur.récupérerMetadataIndicateurFiltrés.useQuery({
      filtres: {
        chantiers:
          !getValues("indicParentCh") || getValues("indicParentCh") === "_"
            ? ["Aucun chantier séléctionné"]
            : [getValues("indicParentCh")],
        perimetresMinisteriels: [],
        estTerritorialise: false,
        estBarometre: false,
      },
    });

  let optionsIndicateurParent: SélecteurOption<string>[];
  if (!getValues("indicParentCh") || getValues("indicParentCh") === "_") {
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

  const setValuePonderation = useMetadataIndicateurForm().setValue;

  function displayParentIndic(indicParentIndic: string | null) {
    return indicParentIndic &&
      indicParentIndic !== "Aucun indicateur selectionné"
      ? `${indicParentIndic} - ${metadataIndicateurs.find((metadataIndicateur) => metadataIndicateur.indicId === indicParentIndic)?.indicNom}`
      : "Pas d'indicateur parent";
  }

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataTextArea
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_nom
            }
            name="indicNom"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteurAvecRecherche
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_parent_ch
            }
            listeValeur={optionsParentCh}
            name="indicParentCh"
            valeurAffiché={`${indicateur.indicParentCh} - ${chantiers.find((chantier) => chantier.id === indicateur.indicParentCh)?.nom}`}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_parent_indic
            }
            listeValeur={optionsIndicateurParent}
            name="indicParentIndic"
            valeurAffiché={displayParentIndic(indicateur.indicParentIndic)}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataTextArea
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_descr
            }
            name="indicDescr"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataTextArea
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_methode_calcul
            }
            name="indicMethodeCalcul"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_type
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "indic_type",
            )}
            name="indicType"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "indic_type",
              "indicType",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_schema
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "indic_schema",
            )}
            name="indicSchema"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "indic_schema",
              "indicSchema",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicUnite"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_unite
            }
            valeurAffiché={indicateur.indicUnite || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.zg_applicable
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "zg_applicable",
            )}
            name="zgApplicable"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "zg_applicable",
              "zgApplicable",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicTerritorialise"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_territorialise
            }
            onChangeSideEffect={(valeur) => {
              if (!valeur) {
                setValuePonderation("poidsPourcentDept", "0");
                setValuePonderation("poidsPourcentReg", "0");
              }
            }}
            valeurAffiché={indicateur.indicTerritorialise ? "Oui" : "Non"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInterrupteur
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicIsBaro"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_baro
            }
            valeurAffiché={indicateur.indicIsBaro ? "Oui" : "Non"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInput
            disabled={!getValues("indicIsBaro")}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicNomBaro"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_nom_baro
            }
            valeurAffiché={indicateur.indicNomBaro || "_"}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInput
            disabled={!getValues("indicIsBaro")}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicDescrBaro"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_descr_baro
            }
            valeurAffiché={indicateur.indicDescrBaro || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataTextArea
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_source
            }
            name="indicSource"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="indicSourceUrl"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_source_url
            }
            valeurAffiché={indicateur.indicSourceUrl || "_"}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.periodicite
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "periodicite",
            )}
            name="periodicite"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "periodicite",
              "periodicite",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="delaiDisponibilite"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.delai_disponibilite
            }
            valeurAffiché={`${indicateur.delaiDisponibilite}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataIndicateur;
