import { FunctionComponent } from "react";
import MultiSelect from "@/client/components/_commons/MultiSelect/MultiSelect";
import {
  MultiSelectOption,
  MultiSelectOptionGroupée,
  MultiSelectOptionsGroupées,
} from "@/client/components/_commons/MultiSelect/MultiSelect.interface";
import { trierParOrdreAlphabétique } from "@/client/utils/arrays";
import api from "@/server/infrastructure/api/trpc/api";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";

interface MultiSelectTerritoireProps {
  changementValeursSélectionnéesCallback: (
    territoiresCodesSélectionnés: string[],
  ) => void;
  territoiresCodesSélectionnésParDéfaut?: string[];
  groupesÀAfficher: {
    nationale: boolean;
    regionale: boolean;
    departementale: boolean;
  };
  territoiresSélectionnables?: string[];
  afficherBoutonsSélection?: boolean;
  activerLaRestrictionDesTerritoires?: boolean;
}

export const MAXIMUM_COMPTES_AUTORISE_PAR_REGION = 200;
export const MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT = 150;
const MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE: Record<MailleInterne, number> = {
  departementale: MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT,
  regionale: MAXIMUM_COMPTES_AUTORISE_PAR_REGION,
};

const générerLesOptions = (
  nom: string,
  code: string,
  maille: MailleInterne,
  nombreUtilisateur: number,
  activerLaRestrictionDesTerritoires: boolean | undefined,
): MultiSelectOption => ({
  label: nom,
  value: code,
  disabled: activerLaRestrictionDesTerritoires
    ? nombreUtilisateur > MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE[maille]
    : false,
  afficherIcone: activerLaRestrictionDesTerritoires
    ? nombreUtilisateur > MAXIMUM_COMPTES_AUTORISE_PAR_TERRITOIRE[maille]
    : false,
});

const MultiSelectTerritoire: FunctionComponent<MultiSelectTerritoireProps> = ({
  territoiresCodesSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  groupesÀAfficher,
  territoiresSélectionnables,
  afficherBoutonsSélection,
  activerLaRestrictionDesTerritoires,
}) => {
  const { data: territoires } = api.territoire.récupérerListe.useQuery(
    { territoireCodes: territoiresSélectionnables || null },
    { staleTime: Number.POSITIVE_INFINITY },
  );

  const départements =
    territoires?.filter(
      (territoire) => territoire.maille === "departementale",
    ) ?? [];
  const régions =
    territoires?.filter((territoire) => territoire.maille === "regionale") ??
    [];

  const optionFR = {
    label: "National",
    options: [
      {
        label: "France",
        value: "NAT-FR",
      },
    ],
  };

  const optionsRégions = {
    label: "Régions",
    options: trierParOrdreAlphabétique(
      régions.map((d) =>
        générerLesOptions(
          d.nomAffiché,
          d.code,
          "regionale",
          d.nombreUtilisateur,
          activerLaRestrictionDesTerritoires,
        ),
      ),
      "label",
    ),
  };

  const optionsDépartements = {
    label: "Départements",
    options: trierParOrdreAlphabétique(
      départements.map((d) =>
        générerLesOptions(
          d.nomAffiché,
          d.code,
          "departementale",
          d.nombreUtilisateur,
          activerLaRestrictionDesTerritoires,
        ),
      ),
      "label",
    ),
  };

  const options: MultiSelectOptionsGroupées = [
    groupesÀAfficher.nationale ? optionFR : null,
    groupesÀAfficher.regionale ? optionsRégions : null,
    groupesÀAfficher.departementale ? optionsDépartements : null,
  ].filter((option): option is MultiSelectOptionGroupée => option !== null);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(
        valeursSélectionnées: string[],
      ) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label="Territoire(s)"
      optionsGroupées={options}
      suffixeLibellé="territoire(s) sélectionné(s)"
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
};

export default MultiSelectTerritoire;
