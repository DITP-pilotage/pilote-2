import { ReactNode } from "react";
import clsx from "clsx";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

interface BasePageChantierSectionProps {
  id: string;
  titre: string;
  sectionClassName?: string;
  titreConteneurClassName?: string;
  infobulle?: ReactNode;
  children: ReactNode;
}

export const BasePageChantierSection = ({
  id,
  titre,
  sectionClassName,
  titreConteneurClassName = "fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0",
  infobulle,
  children,
}: BasePageChantierSectionProps) => {
  const { chantier } = pageChantier.useServerSidePropsContext();
  const estChantierArchive = chantier.statut === "ARCHIVE";

  return (
    <section
      className={clsx(
        "grid grid-rows-[auto_1fr] print:block",
        sectionClassName,
      )}
      id={id}
    >
      {infobulle ? (
        <TitreInfobulleConteneur className={titreConteneurClassName}>
          <Titre
            baliseHtml="h2"
            className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
              "text-primary": !estChantierArchive,
              "!text-dsfr-grey-50": estChantierArchive,
            })}
            estInline
          >
            {titre}
          </Titre>
          <Infobulle>{infobulle}</Infobulle>
        </TitreInfobulleConteneur>
      ) : (
        <Titre
          baliseHtml="h2"
          className={clsx(
            "fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0",
            {
              "text-primary": !estChantierArchive,
              "!text-dsfr-grey-50": estChantierArchive,
            },
          )}
        >
          {titre}
        </Titre>
      )}
      {children}
    </section>
  );
};
