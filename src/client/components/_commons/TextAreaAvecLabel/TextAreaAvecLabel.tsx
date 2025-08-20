import "@gouvfr/dsfr/dist/component/form/form.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import { FunctionComponent, HTMLInputTypeAttribute } from "react";
import {
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegisterReturn,
} from "react-hook-form";
import clsx from "clsx";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";

interface TexteAreaLabelProps {
  libellé: string;
  htmlName: string;
  register: UseFormRegisterReturn;
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
  erreurMessage?: string;
  isRequired?: boolean;
  disabled?: boolean;
  className?: string;
  texteAide?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  libelleRequired?: string;
  compteur?: {
    taille: number;
    limite: number;
  };
}

const TextAreaAvecLabel: FunctionComponent<TexteAreaLabelProps> = ({
  erreur,
  erreurMessage,
  isRequired = false,
  libellé,
  htmlName,
  texteAide,
  register,
  disabled,
  className,
  placeholder,
  libelleRequired,
  compteur,
}) => {
  return (
    <div
      className={`fr-input-group ${erreur !== undefined || erreurMessage ? "fr-input-group--error" : ""}`}
    >
      <label className="fr-label" htmlFor={htmlName}>
        {libellé}
        {isRequired ? <ChampObligatoire /> : null}
        {!!texteAide && <span className="fr-hint-text">{texteAide}</span>}
      </label>
      {libelleRequired ? (
        <p className="fr-text texte-warning fr-text--xs text-italic fr-mb-2w">
          {libelleRequired}
        </p>
      ) : null}
      <textarea
        className={clsx("fr-input resize-none", className, {
          "fr-input-group--error": erreur !== undefined || erreurMessage,
        })}
        disabled={disabled}
        id={htmlName}
        placeholder={placeholder}
        {...register}
      />
      <div className="flex justify-between">
        {(erreur !== undefined || erreurMessage !== undefined) && (
          <p className="fr-error-text fr-mt-1w">
            {erreur?.message?.toString() || erreurMessage}
          </p>
        )}
        {compteur != null && (
          <CompteurCaractères
            className="!ml-auto fr-mt-1w"
            compte={compteur.taille}
            limiteDeCaractères={compteur.limite}
          />
        )}
      </div>
    </div>
  );
};

export default TextAreaAvecLabel;
