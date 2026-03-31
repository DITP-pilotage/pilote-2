import { FunctionComponent } from "react";
import { Controller, FieldPath } from "react-hook-form";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import Input from "@/components/_commons/Input/Input";
import TextArea from "@/components/_commons/TextArea/TextArea";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";
import {
  computeValeurAffichee,
  computeListeValeur,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

interface MetadataIndicateurChampProps {
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
  name: FieldPath<MetadataIndicateurForm>;
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  onChangeSideEffect?: (value: string | boolean) => void;
  estDesactive?: boolean;
  estMandatory?: boolean;
  disabled?: boolean;
  listeValeurOverride?: { valeur: string; libellé: string }[];
  valeurAfficheOverride?: string;
  variante?: "recherche";
}

export const MetadataIndicateurChamp: FunctionComponent<
  MetadataIndicateurChampProps
> = ({
  informationMetadataIndicateur,
  name,
  indicateur,
  estEnCoursDeModification,
  onChangeSideEffect,
  estDesactive,
  estMandatory = informationMetadataIndicateur.metaPiloteMandatory,
  disabled = false,
  listeValeurOverride,
  valeurAfficheOverride,
  variante,
}) => {
  const form = useMetadataIndicateurForm();

  const valeurAffichee =
    valeurAfficheOverride ??
    computeValeurAffichee(
      informationMetadataIndicateur,
      indicateur,
      name as keyof MetadataParametrageIndicateurContrat,
    );

  const listeValeur =
    listeValeurOverride ?? computeListeValeur(informationMetadataIndicateur);

  const editBoxType =
    informationMetadataIndicateur.dataType === "boolean"
      ? "boolean"
      : informationMetadataIndicateur.metaPiloteEditBoxType;

  const renderInput = () => {
    switch (editBoxType) {
      case "text":
        return (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <Input
                disabled={disabled}
                erreurMessage={form.formState.errors[name]?.message}
                htmlName={name}
                onChange={field.onChange}
                type="text"
                value={String(field.value ?? "")}
              />
            )}
          />
        );

      case "textarea":
        return (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <TextArea
                erreurMessage={form.formState.errors[name]?.message}
                htmlName={name}
                onChange={field.onChange}
                value={String(field.value ?? "")}
              />
            )}
          />
        );

      case "boolean":
        return (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <Interrupteur
                checked={!!field.value}
                libellé={field.value ? "Oui" : "Non"}
                onChange={(isChecked) => {
                  field.onChange(isChecked);
                  if (onChangeSideEffect) {
                    onChangeSideEffect(isChecked);
                  }
                }}
              />
            )}
          />
        );

      case "multi-select":
        if (variante === "recherche") {
          return (
            <Controller
              control={form.control}
              name={name}
              render={({ field }) => (
                <SélecteurAvecRecherche
                  erreurMessage={form.formState.errors[name]?.message}
                  estVisibleEnMobile
                  estVueMobile={false}
                  htmlName={name}
                  options={listeValeur}
                  valeurModifiéeCallback={field.onChange}
                  valeurSélectionnée={String(field.value ?? "_")}
                />
              )}
            />
          );
        }

        return (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <Sélecteur
                errorMessage={form.formState.errors[name]?.message}
                estDesactive={estDesactive}
                htmlName={name}
                onChange={(value) => {
                  field.onChange(value);
                  if (onChangeSideEffect) {
                    onChangeSideEffect(value);
                  }
                }}
                options={listeValeur}
                valeurSélectionnée={String(field.value ?? "_")}
              />
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fr-text--md bold fr-mb-1v relative flex align-center ">
        <p className="m-0 overflow-ellipsis">
          {informationMetadataIndicateur.metaPiloteAlias}
        </p>
        {estEnCoursDeModification ? (
          <>
            {estMandatory ? <ChampObligatoire /> : null}
            {informationMetadataIndicateur.metaPiloteDispDispDesc ? (
              <Infobulle>{informationMetadataIndicateur.description}</Infobulle>
            ) : null}
          </>
        ) : null}
      </div>
      {estEnCoursDeModification ? (
        <div className="fr-mt-1w">{renderInput()}</div>
      ) : (
        <span>{valeurAffichee}</span>
      )}
    </>
  );
};
