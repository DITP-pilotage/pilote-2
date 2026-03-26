import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { clsxm } from "@/utils/clsxm";

const SélecteurMaille: FunctionComponent<{
  pathname: string;
  mailleQuery: MailleInterne;
}> = ({ pathname, mailleQuery }) => {
  const { maillesAccessiblesEnLecture } = useTerritoireHabilitation();
  const router = useRouter();

  const maillesInternesAccessiblesEnLecture =
    maillesAccessiblesEnLecture.filter(
      (maille): maille is MailleInterne => maille !== "nationale",
    );

  const mailles: Record<MailleInterne, string> = {
    regionale: "Régions",
    departementale: "Départements",
  };

  if (maillesInternesAccessiblesEnLecture.length <= 1) {
    return null;
  }

  const changerMaille = (maille: MailleInterne) => {
    const initialeTerritoireCode = router.query.territoireCode as string;

    sauvegarderFiltres({ territoireCode: initialeTerritoireCode, maille });

    delete router.query._action;
    delete router.query.pageIndex;
    return router.push(
      {
        pathname,
        query: { ...router.query, maille },
      },
      undefined,
      {
        scroll: false,
      },
    );
  };

  return (
    <div className="w-full flex align-center">
      <label className="fr-label fr-mr-1w no-wrap" htmlFor="maille">
        Affichage :
      </label>
      <div className="flex tag-liste">
        {objectEntries(mailles)
          .filter(([maille]) =>
            maillesInternesAccessiblesEnLecture.includes(maille),
          )
          .map(([maille, libellé]) => (
            <button
              className={clsxm(
                "fr-tag fr-mr-1w",
                mailleQuery === maille && "text-white bg-primary",
              )}
              key={maille}
              onClick={() => changerMaille(maille)}
              type="button"
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap fr-text--sm">
                {libellé}
              </p>
            </button>
          ))}
      </div>
    </div>
  );
};

export default SélecteurMaille;
