import { FunctionComponent } from "react";
import { useRouter } from "next/router";
import { sauvegarderFiltres } from "@/stores/useFiltresStore/useFiltresStore";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { trierParOrdreAlphabétique } from "@/client/utils/arrays";
import { useSession } from "next-auth/react";
import {
  SelectField,
  type SelectFieldOption,
  type SelectFieldOptionGroup,
} from "@/components/shared/SelectField";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { clsxm } from "@/utils/clsxm";

interface SélecteursMaillesEtTerritoiresProps {
  territoireCode: string;
  pathname: string;
  direction?: "horizontal" | "vertical";
  territoiresApplicables?: string[];
}

const générerLesOptions = (
  nom: string,
  code: string,
  desactivee: boolean,
): SelectFieldOption<string> => ({
  libelle: nom,
  valeur: code,
  desactivee,
});

const construireLaListeDOptions = (
  territoiresAccessiblesEnLecture: DétailTerritoire[],
  avecFrance: boolean,
  territoiresApplicables?: string[],
): SelectFieldOptionGroup<string>[] => {
  const territoiresDisponiblesDept = territoiresAccessiblesEnLecture.filter(
    (territoire) => territoire.maille === "departementale",
  );
  const territoiresDisponiblesReg = territoiresAccessiblesEnLecture.filter(
    (territoire) => territoire.maille === "regionale",
  );

  const optionsRégions = {
    libelle: "Régions",
    valeur: "regions",
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
      "libelle",
    ),
  };

  const optionsDépartements = {
    libelle: "Départements",
    valeur: "departements",
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
      "libelle",
    ),
  };

  const optionsFrance = {
    libelle: "",
    valeur: "national",
    options: [générerLesOptions("France", "NAT-FR", false)],
  };

  return [
    ...(avecFrance ? [optionsFrance] : []),
    optionsRégions,
    optionsDépartements,
  ].filter((groupe) => groupe.options.length > 0);
};

export const SélecteursMaillesEtTerritoires: FunctionComponent<
  SélecteursMaillesEtTerritoiresProps
> = ({
  territoireCode,
  pathname,
  direction = "vertical",
  territoiresApplicables,
}) => {
  const router = useRouter();
  const { territoiresAccessiblesEnLecture } = useTerritoireHabilitation();
  const { data: session } = useSession();
  const avecFrance =
    !!session?.habilitations.lecture.territoires.includes("NAT-FR");

  const changerTerritoire = async (territoireCodeSelectionne: string) => {
    if (
      router.query.territoireCode === "NAT-FR" ||
      territoireCodeSelectionne === "NAT-FR"
    ) {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }
    delete router.query.page;
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
    <SelectField
      appearance="striped"
      className={clsxm(
        "w-full",
        direction === "horizontal" && "flex-row items-center gap-2",
      )}
      contentClassName="w-[var(--radix-select-trigger-width)] md:!min-w-0 !max-w-none max-h-96 overflow-hidden rounded-none border-dsfr-grey-200 p-0 [&_[data-radix-select-viewport]]:p-0"
      label={direction === "horizontal" ? "Territoire :" : "Territoire"}
      name="territoire"
      onChange={changerTerritoire}
      options={construireLaListeDOptions(
        territoiresAccessiblesEnLecture,
        avecFrance,
        territoiresApplicables,
      )}
      triggerClassName="flex-1 w-full"
      value={territoireCode}
    />
  );
};
