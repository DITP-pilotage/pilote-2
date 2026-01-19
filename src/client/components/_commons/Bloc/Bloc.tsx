import { FunctionComponent, ReactNode } from "react";
import BlocStyled from "@/components/_commons/Bloc/Bloc.styled";
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
    <BlocStyled className={clsxm("bloc-container", className)}>
      {titre ? (
        <div
          className={clsxm(
            "titre fr-mb-0 fr-p-2w fr-text--sm fr-text--bold flex align-center justify-start relative w-full",
            backgroundClassNameTitre,
          )}
        >
          <div className="titre-ellipsis">{titre}</div>
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
    </BlocStyled>
  );
};

export default Bloc;
