import { FunctionComponent, ReactNode } from "react";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { clsxm } from "@/utils/clsxm";

interface BlocProps {
  children: ReactNode;
  contenuClassesSupplémentaires?: string;
  className?: string;
  titre?: string;
  contenuInfobulle?: ReactNode;
  backgroundClassNameTitre?: string;
}

const Bloc: FunctionComponent<BlocProps> = ({
  children,
  contenuClassesSupplémentaires = "!p-4",
  titre,
  contenuInfobulle,
  className = "",
  backgroundClassNameTitre,
}) => {
  return (
    <div
      className={clsxm(
        "bloc-container min-w-full bg-white border border-dsfr-grey-925 rounded-lg print:h-auto print:border-pilote-grey-border-print",
        className,
      )}
    >
      {titre ? (
        <div
          className={clsxm(
            "titre h-16 border-b-2 border-b-[var(--border-plain-grey)] rounded-t-[7px] fr-mb-0 fr-p-2w fr-text--sm fr-text--bold flex align-center justify-start relative w-full print:rounded-t-lg",
            backgroundClassNameTitre,
          )}
        >
          <div className="w-auto overflow-hidden text-ellipsis whitespace-nowrap">
            {titre}
          </div>
          <div>
            {titre && contenuInfobulle ? (
              <Infobulle classNameBouton="fr-pl-2w">
                {contenuInfobulle}
              </Infobulle>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={clsxm("bloc__contenu", contenuClassesSupplémentaires)}>
        {children}
      </div>
    </div>
  );
};

export default Bloc;
