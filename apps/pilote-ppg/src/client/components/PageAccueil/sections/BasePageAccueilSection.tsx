import { ReactNode } from "react";
import { Infobulle } from "@/components/shared/Infobulle";
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
              <h2 className="text-lg mb-0 py-1 leading-6 inline">{titre}</h2>
              <Infobulle>{infobulle}</Infobulle>
            </TitreInfobulleConteneur>
          ) : (
            <h2 className="text-lg mb-0 py-1 leading-6">{titre}</h2>
          )}
          {children}
        </div>
      </TuileWidget>
    </section>
  );
};
