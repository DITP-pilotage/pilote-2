import { Fragment, useRef } from "react";
import { clsxm } from "@/utils/clsxm";
import SélecteurCustomProps from "./SélecteurCustom.interface";
import useSélecteurCustom from "./useSélecteurCustom";
import "@gouvfr/dsfr/dist/component/radio/radio.css";
import "@gouvfr/dsfr/dist/component/select/select.min.css";

export default function SélecteurCustom<T extends string>({
  htmlName,
  options,
  valeurSélectionnée,
  valeurModifiéeCallback,
}: SélecteurCustomProps<T>) {
  const ref = useRef(null);
  const {
    estOuvert,
    setEstOuvert,
    SélecteurBoutonProps,
    libelléValeurSélectionnée,
  } = useSélecteurCustom(options, valeurSélectionnée);

  return (
    <div className="relative">
      <button
        className="fr-select fr-ellipsis max-w-48 xl:max-w-64 text-left"
        id={htmlName}
        type="button"
        {...SélecteurBoutonProps}
      >
        {libelléValeurSélectionnée}
      </button>
      <div
        className={clsxm(
          "hidden",
          estOuvert && "block absolute z-[2] w-full max-h-80 overflow-auto bg-dsfr-contrast-grey border border-gray-500",
        )}
        ref={ref}
        role="menu"
      >
        {options?.map((option) => (
          <Fragment key={`${option.valeur}`}>
            {!option.désactivée ? (
              <div
                className="fr-px-2w text-base leading-6 even:bg-dsfr-grey-1000 hover:text-white hover:bg-primary"
                id={option.valeur}
                onClick={(événement) => {
                  setEstOuvert(false);
                  return (
                    valeurModifiéeCallback &&
                    valeurModifiéeCallback(événement.currentTarget.id as T)
                  );
                }}
                onKeyDown={(événement) => {
                  if (
                    (événement.key === "Enter" || événement.key === " ") &&
                    !!valeurModifiéeCallback
                  ) {
                    valeurModifiéeCallback(événement.currentTarget.id as T);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {option.libellé}
              </div>
            ) : (
              <div className="fr-px-2w text-base leading-6 text-dsfr-mention-grey" id={option.valeur}>
                {option.libellé}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
