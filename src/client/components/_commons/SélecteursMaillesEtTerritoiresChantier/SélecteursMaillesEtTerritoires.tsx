import { FunctionComponent } from "react";
import { useRouter } from "next/router";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { trierParOrdreAlphabétique } from "@/client/utils/arrays";
import {
  InputGroupeOptionGroupée,
  InputGroupeOptionsGroupées,
} from "@/components/_commons/InputGroupe/InputGroupe.interface";
import { MultiSelectOption } from "@/components/_commons/MultiSelect/MultiSelect.interface";
import { InputGroupeTerritoire } from "@/components/_commons/InputGroupe/InputGroupeTerritoire/InputGroupeTerritoire";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";

interface SélecteursMaillesEtTerritoiresProps {
  territoireCode: string;
  pathname: string;
  direction?: "horizontal" | "vertical";
  territoiresApplicables?: string[];
}

const générerLesOptions = (
  nom: string,
  code: string,
  disabled: boolean,
): MultiSelectOption => ({
  label: nom,
  value: code,
  disabled,
});

const construireLaListeDOptions = (
  territoiresAccessiblesEnLecture: DétailTerritoire[],
  territoiresApplicables?: string[],
) => {
  const territoiresDisponiblesDept = territoiresAccessiblesEnLecture.filter(
    (territoire) => territoire.maille === "departementale",
  );
  const territoiresDisponiblesReg = territoiresAccessiblesEnLecture.filter(
    (territoire) => territoire.maille === "regionale",
  );

  const optionsRégions = {
    label: "Régions",
    options: trierParOrdreAlphabétique(
      territoiresDisponiblesReg.map((region) =>
        générerLesOptions(
          region.nomAffiché,
          region.code,
          territoiresApplicables
            ? !territoiresApplicables.includes(region.code)
            : false,
        ),
      ),
      "label",
    ),
  };

  const optionsDépartements = {
    label: "Départements",
    options: trierParOrdreAlphabétique(
      territoiresDisponiblesDept.map((departement) =>
        générerLesOptions(
          departement.nomAffiché,
          departement.code,
          territoiresApplicables
            ? !territoiresApplicables.includes(departement.code)
            : false,
        ),
      ),
      "label",
    ),
  };

  return [optionsRégions, optionsDépartements].filter(
    (option): option is InputGroupeOptionGroupée => option !== null,
  ) satisfies InputGroupeOptionsGroupées;
};

const SélecteursMaillesEtTerritoires: FunctionComponent<
  SélecteursMaillesEtTerritoiresProps
> = ({
  territoireCode,
  pathname,
  direction = "vertical",
  territoiresApplicables,
}) => {
  const router = useRouter();
  const { territoiresAccessiblesEnLecture } = useTerritoireHabilitation();

  const changerTerritoire = async (territoireCodeSelectionne: string) => {
    if (
      router.query.territoireCode === "NAT-FR" ||
      territoireCodeSelectionne === "NAT-FR"
    ) {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }
    delete router.query.pageIndex;
    delete router.query._action;

    const { maille } = territoireCodeVersMailleCodeInsee(
      territoireCodeSelectionne,
    );

    router.query.maille =
      maille === "DEPT"
        ? "departementale"
        : maille === "REG"
          ? "regionale"
          : router.query.maille;

    sauvegarderFiltres({ territoireCode: territoireCodeSelectionne });

    return router.push(
      {
        pathname,
        query: { ...router.query, territoireCode: territoireCodeSelectionne },
      },
      undefined,
      {
        scroll: false,
      },
    );
  };

  return (
    <InputGroupeTerritoire
      changementValeurSelectionneeCallback={(valeurSélectionne: string) =>
        changerTerritoire(valeurSélectionne)
      }
      direction={direction}
      options={construireLaListeDOptions(
        territoiresAccessiblesEnLecture,
        territoiresApplicables,
      )}
      territoireCodeSelectionneParDefaut={territoireCode}
    />
  );
};

export default SélecteursMaillesEtTerritoires;
