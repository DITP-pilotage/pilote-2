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
import { clsxm } from "@/utils/clsxm";

interface InputAvecLabelProps {
  type?: HTMLInputTypeAttribute;
  libellé: string;
  isRequired?: boolean;
  htmlName: string;
  texteAide?: string;
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl>;
  register: UseFormRegisterReturn;
  disabled?: boolean;
  className?: string;
}

const InputAvecLabel: FunctionComponent<InputAvecLabelProps> = ({
  type = "text",
  erreur,
  libellé,
  isRequired = false,
  htmlName,
  texteAide,
  register,
  disabled,
  className,
}) => {
  return (
    <div
      className={clsxm(
        `fr-input-group`,
        erreur && "fr-input-group--error",
        className,
      )}
    >
      <label className="fr-label" htmlFor={htmlName}>
        {libellé}
        {isRequired ? <ChampObligatoire /> : null}
        {!!texteAide && <span className="fr-hint-text">{texteAide}</span>}
      </label>
      <input
        className={`fr-input ${erreur !== undefined ? "fr-input-group--error" : ""}`}
        disabled={disabled}
        id={htmlName}
        type={type}
        {...register}
      />
      {erreur !== undefined && (
        <p className="fr-error-text">{erreur.message?.toString()}</p>
      )}
    </div>
  );
};

export default InputAvecLabel;
