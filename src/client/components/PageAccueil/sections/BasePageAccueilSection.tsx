import { ReactNode } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";

interface BasePageAccueilSectionProps {
  id: string;
  titre: string;
  infobulle?: ReactNode;
  titreConteneurClassName?: string;
  children: ReactNode;
  className?: string;
}

export const BasePageAccueilSection = ({
  id,
  titre,
  infobulle,
  titreConteneurClassName = "fr-mb-1w fr-mt-3v fr-mt-md-0 flex w-full justify-between",
  children,
  className,
}: BasePageAccueilSectionProps) => {
  return (
    <section className={className} id={id}>
      <TuileWidget>
        <div>
          {infobulle ? (
            <TitreInfobulleConteneur className={titreConteneurClassName}>
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
        </div>
      </TuileWidget>
    </section>
  );
};
