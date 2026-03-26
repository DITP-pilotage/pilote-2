import { FunctionComponent, useId, useRef } from "react";
import { useSession } from "next-auth/react";
import InputGroupeProps from "@/components/_commons/InputGroupe/InputGroupe.interface";
import InputGroupeItem from "@/components/_commons/InputGroupe/InputGroupeItem";
import { clsxm } from "@/utils/clsxm";
import useInputGroupe from "./useInputGroupe";

const InputGroupe: FunctionComponent<InputGroupeProps> = ({
  optionsGroupées,
  valeurSelectionneeParDefaut,
  changementValeurSelectionneeCallback,
  label,
  desactive,
  libelle,
  direction,
}) => {
  const id = useId();
  const ref = useRef(null);
  const { data: session } = useSession();
  const {
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert,
    multiSelectBoutonProps,
    uniqueId,
  } = useInputGroupe({
    optionsGroupées,
    ref,
    valeurSelectionneeParDefaut,
  });

  const possedeLeDroitSurLaMailleNat =
    session!.habilitations.lecture.territoires.includes("NAT-FR");

  return (
    <div className="relative">
      <div
        className={`${direction === "horizontal" ? " flex align-center" : ""}`}
      >
        <label
          className={`fr-label no-wrap ${direction === "horizontal" ? "fr-mr-1w" : ""}`}
          htmlFor={id}
        >
          {label}
          {direction === "horizontal" ? (
            <span className="fr-text-title--blue-france"> :</span>
          ) : null}
        </label>
        <button
          className={`fr-select fr-ellipsis text-left ${direction === "horizontal" ? "fr-mt-0" : ""}`}
          disabled={desactive}
          id={id}
          title={libelle}
          type="button"
          {...multiSelectBoutonProps}
        >
          {libelle}
        </button>
      </div>
      <div
        className={clsxm(
          "hidden",
          estOuvert &&
            "block absolute z-[2] w-full max-h-80 overflow-auto bg-white border border-gray-500",
        )}
        ref={ref}
        role="menu"
      >
        <div className="w-full fr-p-2w">
          <input
            className="fr-input"
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher..."
            type="text"
            value={recherche}
          />
        </div>
        {possedeLeDroitSurLaMailleNat ? (
          <button
            className="w-full texte-gauche fr-py-1v fr-pl-2w bg-dsfr-grey-1000"
            style={
              {
                "--idle": "transparent",
                "--hover": "var(--background-alt-grey-hover)",
                "--active": "var(--background-alt-grey-active)",
              } as React.CSSProperties
            }
            disabled={valeurSelectionneeParDefaut === "NAT-FR"}
            id="NAT-FR"
            key="NAT-FR"
            name="NAT-FR"
            onClick={() => changementValeurSelectionneeCallback("NAT-FR")}
            type="button"
          >
            France
          </button>
        ) : null}
        {optionsGroupéesFiltrées.map((groupe) => (
          <InputGroupeItem
            changementÉtatCallback={(valeur) =>
              changementValeurSelectionneeCallback(valeur)
            }
            groupeOptions={groupe}
            key={`${groupe.label} ${uniqueId}`}
            valeurSelectionnee={valeurSelectionneeParDefaut}
          />
        ))}
      </div>
    </div>
  );
};

export default InputGroupe;
