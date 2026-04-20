import { FunctionComponent, useId, useRef } from "react";
import MultiSelectProps from "@/components/_commons/MultiSelectNew/MultiSelect.interface";
import MultiSelectGroupe from "@/components/_commons/MultiSelectNew/MultiSelectGroupe";
import BoutonToutSélectionner from "@/components/_commons/BoutonsToutSélectionner/BoutonsToutSélectionner";
import { clsxm } from "@/utils/clsxm";
import useMultiSelect from "./useMultiSelect";
import "@gouvfr/dsfr/dist/component/select/select.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import "@gouvfr/dsfr/dist/component/form/form.min.css";

const MultiSelect: FunctionComponent<MultiSelectProps> = ({
  suffixeLibellé,
  optionsGroupées,
  valeursSélectionnéesParDéfaut,
  changementValeursSélectionnéesCallback,
  label,
  afficherBoutonsSélection,
  desactive,
}) => {
  const id = useId();
  const ref = useRef(null);
  const {
    mettreÀJourLesValeursSélectionnées,
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert,
    multiSelectBoutonProps,
    valeursSélectionnées,
    uniqueId,
    libellé,
  } = useMultiSelect(
    optionsGroupées,
    suffixeLibellé,
    changementValeursSélectionnéesCallback,
    ref,
    valeursSélectionnéesParDéfaut,
  );

  return (
    <div className="relative">
      <label className="fr-label" htmlFor={id}>
        {label}
      </label>
      {afficherBoutonsSélection ? (
        <BoutonToutSélectionner
          className="fr-mt-2w"
          onClickToutDésélectionner={() =>
            changementValeursSélectionnéesCallback([])
          }
          onClickToutSélectionner={() =>
            changementValeursSélectionnéesCallback(
              optionsGroupéesFiltrées.flatMap((groupe) =>
                groupe.options.map((option) => option.value),
              ),
            )
          }
        />
      ) : null}
      <button
        className="fr-select fr-ellipsis text-left"
        disabled={desactive}
        id={id}
        title={libellé}
        type="button"
        {...multiSelectBoutonProps}
      >
        {libellé}
      </button>
      <div
        className={clsxm(
          "hidden",
          estOuvert &&
            "block absolute z-[2] w-full max-h-80 p-4 overflow-auto bg-white border border-gray-500",
        )}
        ref={ref}
        role="menu"
      >
        <input
          className="fr-input"
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher..."
          type="text"
          value={recherche}
        />
        {optionsGroupéesFiltrées.map((groupe) => (
          <MultiSelectGroupe
            changementÉtatCallback={(valeur) =>
              mettreÀJourLesValeursSélectionnées(valeur)
            }
            groupeOptions={groupe}
            key={`${groupe.label} ${uniqueId}`}
            valeursSélectionnées={valeursSélectionnées}
          />
        ))}
      </div>
    </div>
  );
};

export default MultiSelect;
