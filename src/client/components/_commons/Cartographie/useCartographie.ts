import { useRouter } from "next/router";
import { parseAsString, useQueryState } from "nuqs";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import {
  CartographieOptions,
  CartographieTerritoireAffiché,
  CartographieTerritoires,
} from "./useCartographie.interface";
import { CartographieDonnées } from "./Cartographie.interface";

export default function useCartographie(
  territoireCode: string,
  pathname:
    | "/accueil/chantier/[territoireCode]"
    | "/chantier/[id]/[territoireCode]"
    | null,
) {
  const { territoiresAccessiblesEnLecture, listeTerritoires } =
    useTerritoireHabilitation();
  const régions = listeTerritoires.filter(
    (territoire) => territoire.maille === "regionale",
  );
  const [territoiresCompares, setTerritoiresCompares] = useQueryState(
    "territoiresCompares",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  const router = useRouter();

  function déterminerRégionsÀTracer(
    territoireAffiché: CartographieTerritoireAffiché,
  ) {
    return territoireAffiché.maille === "regionale"
      ? régions.filter(
          (région) => région.codeInsee === territoireAffiché.codeInsee,
        )
      : régions;
  }

  function créerTerritoires(
    territoiresÀTracer: DétailTerritoire[],
    frontièresÀTracer: DétailTerritoire[],
    données: CartographieDonnées,
  ): CartographieTerritoires {
    return {
      territoires: territoiresÀTracer.map((territoire) => ({
        codeInsee: territoire.codeInsee,
        territoireCode: territoire.code,
        code: territoire.code,
        remplissage: données[territoire.code]?.remplissage ?? "#bababa", // TODO où gérer ce undefined ?
        libellé: données[territoire.code]?.libellé ?? "-", // TODO où gérer ce undefined ?
        contenuInfoBulle: données[territoire.code].contenu, // TODO où gérer ce undefined ?
        estInteractif: territoire.accèsLecture,
        estApplicable: données[territoire.code].estApplicable,
      })),
      frontières: frontièresÀTracer.map((frontière) => ({
        codeInsee: frontière.codeInsee,
        code: frontière.code,
      })),
    };
  }

  const optionsParDéfaut: CartographieOptions = {
    territoireAffiché: {
      codeInsee: "FR",
      maille: "nationale",
    },
    territoireSélectionnable: true,
    multiséléction: false,
    estInteractif: true,
  };

  function auClicTerritoireCallback(
    territoireCodeSelectionnee: string,
    territoireSélectionnable: boolean,
  ) {
    if (!territoireSélectionnable) return;

    const listeTerritoiresCompares = territoiresCompares
      .split(",")
      .filter(Boolean);

    let code =
      territoireCode === territoireCodeSelectionnee &&
      territoiresAccessiblesEnLecture.some(
        (territoire) => territoire.maille === "nationale",
      )
        ? "NAT-FR"
        : territoireCodeSelectionnee;

    if (router.query.territoireCode === "NAT-FR" || code === "NAT-FR") {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
    }

    if (router.query.territoireCode === code) {
      delete router.query.estEnAlerteTauxAvancementNonCalculé;
      delete router.query.estEnAlerteÉcart;
      code = "NAT-FR";
    }

    delete router.query.pageIndex;

    if (listeTerritoiresCompares.includes(territoireCodeSelectionnee)) {
      listeTerritoiresCompares.splice(
        listeTerritoiresCompares.indexOf(territoireCodeSelectionnee),
        1,
      );
    } else {
      router.query.territoireCode = code;
    }

    if (listeTerritoiresCompares.length === 0) {
      delete router.query.territoiresCompares;
    } else {
      router.query.territoiresCompares = listeTerritoiresCompares.join(",");
    }

    return router.push(
      {
        pathname,
        query: { ...router.query },
      },
      undefined,
      {
        scroll: false,
      },
    );
  }

  function auClicTerritoireMultiSélectionCallback(
    territoireCodeSelectionnee: string,
    territoireSélectionnable: boolean,
  ) {
    if (!territoireSélectionnable) return;

    const listeTerritoiresCompares = territoiresCompares
      .split(",")
      .filter(Boolean);

    if (territoireCode === territoireCodeSelectionnee) {
      delete router.query.territoiresCompares;
      return auClicTerritoireCallback(
        territoireCodeSelectionnee,
        territoireSélectionnable,
      );
    }

    let territoireCompareCode =
      territoireCode === territoireCodeSelectionnee &&
      territoiresAccessiblesEnLecture.some(
        (territoire) => territoire.maille === "nationale",
      )
        ? "NAT-FR"
        : territoireCodeSelectionnee;

    if (listeTerritoiresCompares.includes(territoireCompareCode)) {
      listeTerritoiresCompares.splice(
        listeTerritoiresCompares.indexOf(territoireCompareCode),
        1,
      );
      setTerritoiresCompares(listeTerritoiresCompares.join(","));
    } else {
      setTerritoiresCompares(
        [territoireCompareCode, ...listeTerritoiresCompares].join(","),
      );
    }
  }

  return {
    déterminerRégionsÀTracer,
    créerTerritoires,
    optionsParDéfaut,
    auClicTerritoireCallback,
    auClicTerritoireMultiSélectionCallback,
  };
}
