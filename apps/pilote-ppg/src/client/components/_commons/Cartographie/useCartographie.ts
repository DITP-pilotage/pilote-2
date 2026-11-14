import { useRouter } from "next/router";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";

export function useCartographie(
  territoireCode: string,
  pathname:
    | "/accueil/chantier/[territoireCode]"
    | "/chantier/[id]/[territoireCode]"
    | null,
) {
  const { territoiresAccessiblesEnLecture } = useTerritoireHabilitation();
  const [territoiresCompares, setTerritoiresCompares] =
    useTerritoiresCompares();

  const router = useRouter();

  function onTerritoireClick(
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

    delete router.query.page;

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

  function onTerritoireMultiSelectClick(
    territoireCodeSelectionnee: string,
    territoireSélectionnable: boolean,
  ) {
    if (!territoireSélectionnable) return;

    const listeTerritoiresCompares = territoiresCompares
      .split(",")
      .filter(Boolean);

    if (territoireCode === territoireCodeSelectionnee) {
      delete router.query.territoiresCompares;
      return onTerritoireClick(
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

  return { onTerritoireClick, onTerritoireMultiSelectClick };
}
