import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { sauvegarderFiltres } from "@/stores/useFiltresStore/useFiltresStore";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { TagToggleGroup } from "@/components/shared/Tag";

export const SélecteurMaille: FunctionComponent<{
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
    delete router.query.page;
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
    <div className="w-full flex items-center">
      <span
        className="fr-label fr-mr-1w whitespace-nowrap"
        id="libelle-selecteur-maille"
      >
        Affichage :
      </span>
      <TagToggleGroup.Root
        className="flex-nowrap"
        aria-labelledby="libelle-selecteur-maille"
        onValueChange={(valeur) => {
          const maille = maillesInternesAccessiblesEnLecture.find(
            (mailleAccessible) => mailleAccessible === valeur,
          );
          if (maille) changerMaille(maille);
        }}
        value={mailleQuery}
      >
        {objectEntries(mailles)
          .filter(([maille]) =>
            maillesInternesAccessiblesEnLecture.includes(maille),
          )
          .map(([maille, libellé]) => (
            <TagToggleGroup.Item key={maille} value={maille}>
              {libellé}
            </TagToggleGroup.Item>
          ))}
      </TagToggleGroup.Root>
    </div>
  );
};
