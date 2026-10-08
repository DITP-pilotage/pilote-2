import { ReactNode } from "react";
import clsx from "clsx";
import { Infobulle } from "@/components/shared/Infobulle";
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
  titreConteneurClassName = "fr-mb-1w fr-mt-3v fr-mt-md-0",
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
          <h2
            className={
              "inline " +
              clsx("text-h4 md:text-h4-md mb-0 py-1", {
                "text-primary": !estChantierArchive,
                "!text-dsfr-grey-50": estChantierArchive,
              })
            }
          >
            {titre}
          </h2>
          <Infobulle>{infobulle}</Infobulle>
        </TitreInfobulleConteneur>
      ) : (
        <h2
          className={clsx(
            "text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0",
            {
              "text-primary": !estChantierArchive,
              "!text-dsfr-grey-50": estChantierArchive,
            },
          )}
        >
          {titre}
        </h2>
      )}
      {children}
    </section>
  );
};
