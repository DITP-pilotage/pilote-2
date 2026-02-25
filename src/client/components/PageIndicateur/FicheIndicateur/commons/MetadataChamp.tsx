import { PropsWithChildren } from "react";
import {
  ControllerRenderProps,
  FieldValues,
  Path,
  useFormContext,
  Controller,
} from "react-hook-form";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import Input from "@/components/_commons/Input/Input";
import TextArea from "@/components/_commons/TextArea/TextArea";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";

export function MetadataChamp<T extends FieldValues>({
  children,
  informationMetadata,
  estEnCoursDeModification,
  valeurAffiché,
  estMandatory = informationMetadata.metaPiloteMandatory,
  type = informationMetadata.metaPiloteEditBoxType,
  htmlName = "" as Path<T>,
  disabled = false,
  listeValeur,
  avecRecherche = false,
  onChangeSideEffect,
}: PropsWithChildren<{
  informationMetadata: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
  valeurAffiché?: string;
  estMandatory?: boolean;
  type: "text" | "textarea" | "boolean" | "multi-select";
  htmlName: Path<T>;
  disabled?: boolean;
  listeValeur?: { valeur: string; libellé: string }[];
  avecRecherche?: boolean;
  onChangeSideEffect?: (value: string | boolean) => void;
}>) {
  const form = useFormContext<T>();

  const erreurMessage = form.formState.errors[htmlName]?.message as
    | string
    | undefined;

  function renderChamp(field: ControllerRenderProps<T, Path<T>>) {
    console.log(field.value);
    switch (informationMetadata.metaPiloteEditBoxType) {
      case "text":
        return (
          <Input
            disabled={disabled}
            erreurMessage={erreurMessage}
            htmlName={htmlName}
            onChange={field.onChange}
            type="text"
            value={field.value || ""}
          />
        );
      case "textarea":
        return (
          <TextArea
            disabled={disabled}
            erreurMessage={erreurMessage}
            htmlName={htmlName}
            onChange={field.onChange}
            value={field.value || ""}
          />
        );
      case "boolean":
        return (
          <Interrupteur
            checked={field.value}
            libellé={field.value ? "Oui" : "Non"}
            onChange={(isChecked) => {
              field.onChange(isChecked);
              onChangeSideEffect?.(isChecked);
            }}
          />
        );
      case "multi-select":
        if (avecRecherche) {
          return (
            <SélecteurAvecRecherche
              erreurMessage={erreurMessage}
              estVisibleEnMobile
              estVueMobile={false}
              htmlName={htmlName}
              options={listeValeur || []}
              valeurModifiéeCallback={field.onChange}
              valeurSélectionnée={field.value || "_"}
            />
          );
        }
        return (
          <Sélecteur
            errorMessage={erreurMessage}
            estDesactive={disabled}
            htmlName={htmlName}
            onChange={(value) => {
              field.onChange(value);
              if (onChangeSideEffect) {
                onChangeSideEffect(value);
              }
            }}
            options={listeValeur || []}
            valeurSélectionnée={field.value || "_"}
          />
        );
      default:
        return "todo";
    }
  }

  return (
    <>
      <div className="flex items-center text-base bold mb-1 relative">
        <p className="m-0 overflow-ellipsis">
          {informationMetadata.metaPiloteAlias}
        </p>
        {estEnCoursDeModification ? (
          <>
            {estMandatory ? <ChampObligatoire /> : null}
            {informationMetadata.metaPiloteDispDispDesc ? (
              <Infobulle>{informationMetadata.description}</Infobulle>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-2">
        <Controller
          control={form.control}
          name={htmlName}
          render={({ field }) => (
            <>
              {estEnCoursDeModification ? (
                renderChamp(field)
              ) : (
                <span>{field.value || valeurAffiché || "_"}</span>
              )}
            </>
          )}
        />
      </div>
    </>
  );
}
