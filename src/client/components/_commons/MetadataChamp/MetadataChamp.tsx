import { FunctionComponent } from "react";
import {
  Controller,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { ChampObligatoire } from "@/components/_commons/ChampObligatoire/ChampObligatoire";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import Input from "@/components/_commons/Input/Input";
import TextArea from "@/components/_commons/TextArea/TextArea";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";

type MetadataChampInfo = {
  metaPiloteAlias: string;
  metaPiloteMandatory: boolean;
  metaPiloteDispDispDesc: boolean;
  description: string;
};

type MetadataChampBase<TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  name: FieldPath<TForm>;
  informationMetadata: MetadataChampInfo;
  estEnCoursDeModification: boolean;
  valeurAffichee: string;
  estMandatory?: boolean;
};

type MetadataChampText<TForm extends FieldValues> = MetadataChampBase<TForm> & {
  editBoxType: "text";
  disabled?: boolean;
};

type MetadataChampTextArea<TForm extends FieldValues> =
  MetadataChampBase<TForm> & {
    editBoxType: "textarea";
  };

type MetadataChampBoolean<TForm extends FieldValues> =
  MetadataChampBase<TForm> & {
    editBoxType: "boolean";
    onChangeSideEffect?: (value: boolean) => void;
  };

type MetadataChampSelect<TForm extends FieldValues> =
  MetadataChampBase<TForm> & {
    editBoxType: "multi-select";
    listeValeur: { valeur: string; libellé: string }[];
    estDesactive?: boolean;
    onChangeSideEffect?: (value: string) => void;
    variante?: "recherche";
  };

export type MetadataChampProps<TForm extends FieldValues> =
  | MetadataChampText<TForm>
  | MetadataChampTextArea<TForm>
  | MetadataChampBoolean<TForm>
  | MetadataChampSelect<TForm>;

function MetadataChampInterne<TForm extends FieldValues>(
  props: MetadataChampProps<TForm>,
) {
  const {
    form,
    name,
    informationMetadata,
    estEnCoursDeModification,
    valeurAffichee,
    estMandatory = informationMetadata.metaPiloteMandatory,
  } = props;

  const erreurMessage = form.formState.errors[name]?.message as string;

  const renderChamp = (
    field: ControllerRenderProps<TForm, FieldPath<TForm>>,
  ) => {
    if (props.editBoxType === "text") {
      return (
        <Input
          disabled={props.disabled}
          erreurMessage={erreurMessage}
          htmlName={name}
          onChange={field.onChange}
          type="text"
          value={String(field.value ?? "")}
        />
      );
    }

    if (props.editBoxType === "textarea") {
      return (
        <TextArea
          erreurMessage={erreurMessage}
          htmlName={name}
          onChange={field.onChange}
          value={String(field.value ?? "")}
        />
      );
    }

    if (props.editBoxType === "boolean") {
      return (
        <Interrupteur
          checked={!!field.value}
          libellé={field.value ? "Oui" : "Non"}
          onChange={(isChecked) => {
            field.onChange(isChecked);
            if (props.onChangeSideEffect) {
              props.onChangeSideEffect(isChecked);
            }
          }}
        />
      );
    }

    if (props.variante === "recherche") {
      return (
        <SélecteurAvecRecherche
          erreurMessage={erreurMessage}
          estVisibleEnMobile
          estVueMobile={false}
          htmlName={name}
          options={props.listeValeur}
          valeurModifiéeCallback={field.onChange}
          valeurSélectionnée={String(field.value ?? "_")}
        />
      );
    }

    return (
      <Sélecteur
        errorMessage={erreurMessage}
        estDesactive={props.estDesactive}
        htmlName={name}
        onChange={(value) => {
          field.onChange(value);
          if (props.onChangeSideEffect) {
            props.onChangeSideEffect(value);
          }
        }}
        options={props.listeValeur}
        valeurSélectionnée={String(field.value ?? "_")}
      />
    );
  };

  return (
    <>
      <div className="fr-text--md bold fr-mb-1v relative flex align-center ">
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
      {estEnCoursDeModification ? (
        <div className="fr-mt-1w">
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => renderChamp(field)}
          />
        </div>
      ) : (
        <span>{valeurAffichee}</span>
      )}
    </>
  );
}

export const MetadataChamp = MetadataChampInterne as <
  TForm extends FieldValues,
>(
  props: MetadataChampProps<TForm>,
) => ReturnType<FunctionComponent>;
