import "@gouvfr/dsfr/dist/component/modal/modal.min.css";
import { FunctionComponent } from "react";
import clsx from "clsx";
import Titre from "@/components/_commons/Titre/Titre";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import ModaleProps from "./Modale.interface";
import ModaleStyled from "./Modale.styled";
import useModale from "./useModale";

const Modale__legacy: FunctionComponent<ModaleProps> = ({
  children,
  titre,
  sousTitre,
  idHtml,
  ouvertureCallback,
  fermetureCallback,
  tailleModale = "md",
  scrollable = false,
}) => {
  const { modaleRef } = useModale(ouvertureCallback, fermetureCallback);

  const taillePossible = {
    md: "fr-col-12 fr-col-md-10  fr-col-lg-9",
    lg: "fr-col-12 fr-col-md-11 fr-col-lg-10",
  };

  return (
    <ModaleStyled>
      <dialog className="fr-modal" id={idHtml} ref={modaleRef}>
        <div className="fr-container fr-container--fluid fr-container-md">
          <div
            className={`fr-modal__body ${taillePossible[tailleModale]} fr-mx-auto modale-conteneur`}
          >
            <div className="!text-sm flex justify-end align-center !mt-2 !mr-4 !md:mr-0">
              <button
                aria-controls={idHtml}
                className="!text-primary flex align-center gap-1 px-4 py-2"
                title="Fermer la fenêtre modale"
                type="button"
              >
                Fermer
                <Icone
                  className="w-4 h-4 !text-current"
                  icone={CloseLineIcon}
                />
              </button>
            </div>
            <div className="fr-mx-4w">
              {titre ? (
                <Titre baliseHtml="h1" className="fr-modal__title fr-mb-1w">
                  {titre}
                </Titre>
              ) : null}
              {!!sousTitre && <p className="fr-text--lg bold">{sousTitre}</p>}
            </div>
            <div
              className={clsx(
                "fr-modal__content fr-px-4w fr-mb-4w h-full",
                scrollable ? "overflow-y-scroll" : "overflow-y-auto",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </dialog>
    </ModaleStyled>
  );
};

export default Modale__legacy;
