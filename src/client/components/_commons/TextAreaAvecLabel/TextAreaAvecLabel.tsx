import "@gouvfr/dsfr/dist/component/form/form.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import { FunctionComponent, HTMLInputTypeAttribute } from "react";
import {
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegisterReturn,
} from "react-hook-form";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";

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
        className={`fr-input${erreur !== undefined || erreurMessage ? " fr-input-group--error" : ""}${className !== undefined ? " " + className : ""}`}
        disabled={disabled}
        id={htmlName}
        placeholder={placeholder}
        {...register}
      />
      {(erreur !== undefined || erreurMessage !== undefined) && (
        <p className="fr-error-text">
          {erreur?.message?.toString() || erreurMessage}
        </p>
      )}
    </div>
  );
};

export default TextAreaAvecLabel;
