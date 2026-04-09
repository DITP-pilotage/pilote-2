import { ReactNode } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";

interface BasePageAccueilSectionProps {
  id: string;
  titre: string;
  infobulle?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const BasePageAccueilSection = ({
  id,
  titre,
  infobulle,
  children,
  className,
}: BasePageAccueilSectionProps) => {
  return (
    <section className={className} id={id}>
      {infobulle ? (
        <TitreInfobulleConteneur>
          <Titre
            baliseHtml="h2"
            className="fr-text--lg fr-mb-0 fr-py-1v leading-6"
            estInline
          >
            {titre}
          </Titre>
          <Infobulle>{infobulle}</Infobulle>
        </TitreInfobulleConteneur>
      ) : (
        <Titre
          baliseHtml="h2"
          className="fr-text--lg fr-mb-0 fr-py-1v leading-6"
        >
          {titre}
        </Titre>
      )}
      {children}
    </section>
  );
};
