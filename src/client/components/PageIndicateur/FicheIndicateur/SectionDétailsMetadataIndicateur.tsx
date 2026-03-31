import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
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
  const { getValues, setValue } = useMetadataIndicateurForm();

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

  function displayParentIndic(indicParentIndic: string | null) {
    return indicParentIndic
      ? `${indicParentIndic} - ${metadataIndicateurs.find((metadataIndicateur) => metadataIndicateur.indicId === indicParentIndic)?.indicNom}`
      : "Pas d'indicateur parent";
  }

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_nom
            }
            name="indicNom"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_parent_ch
            }
            listeValeurOverride={optionsParentCh}
            name="indicParentCh"
            valeurAfficheOverride={`${indicateur.indicParentCh} - ${chantiers.find((chantier) => chantier.id === indicateur.indicParentCh)?.nom}`}
            variante="recherche"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_parent_indic
            }
            listeValeurOverride={optionsIndicateurParent}
            name="indicParentIndic"
            valeurAfficheOverride={displayParentIndic(
              indicateur.indicParentIndic,
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_descr
            }
            name="indicDescr"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_methode_calcul
            }
            name="indicMethodeCalcul"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_type
            }
            name="indicType"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_schema
            }
            name="indicSchema"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_unite
            }
            name="indicUnite"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.zg_applicable
            }
            name="zgApplicable"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_territorialise
            }
            name="indicTerritorialise"
            onChangeSideEffect={(valeur) => {
              if (!valeur) {
                setValue("poidsPourcentDept", "0");
                setValue("poidsPourcentReg", "0");
              }
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_is_baro
            }
            name="indicIsBaro"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            disabled={!getValues("indicIsBaro")}
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_nom_baro
            }
            name="indicNomBaro"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            disabled={!getValues("indicIsBaro")}
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_descr_baro
            }
            name="indicDescrBaro"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_source
            }
            name="indicSource"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.indic_source_url
            }
            name="indicSourceUrl"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.periodicite
            }
            name="periodicite"
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.delai_disponibilite
            }
            name="delaiDisponibilite"
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataIndicateur;
