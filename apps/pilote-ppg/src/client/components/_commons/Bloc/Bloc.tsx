import { FunctionComponent, ReactNode } from "react";
import { Infobulle } from "@/components/shared/Infobulle";
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
  contenuClassesSupplémentaires = "p-4",
  titre,
  contenuInfobulle,
  className = "",
  backgroundClassNameTitre,
}) => {
  return (
    <div
      className={clsxm(
        "min-w-full bg-white border border-dsfr-grey-925 rounded-lg print:h-auto print:border-pilote-grey-border-print",
        className,
      )}
    >
      {titre ? (
        <div
          className={clsxm(
            "text-sm print:text-base font-bold h-16 border-b-2 border-b-dsfr-grey-200 rounded-t-[7px] mb-0 p-4 flex items-center justify-start relative w-full print:rounded-t-lg",
            backgroundClassNameTitre,
          )}
        >
          <div className="w-auto overflow-hidden text-ellipsis whitespace-nowrap">
            {titre}
          </div>
          <div>
            {titre && contenuInfobulle ? (
              <Infobulle>{contenuInfobulle}</Infobulle>
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
