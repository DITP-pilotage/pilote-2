import { Label } from "radix-ui";
import { ComponentProps, ReactNode, useId } from "react";
import { ChampObligatoire } from "@/components/_commons/ChampObligatoire/ChampObligatoire";
import { clsxm } from "@/utils/clsxm";

// Reproduit le champ de saisie du DSFR (fr-input) : fond gris, trait bas, libellé
// puis aide en gris ; en erreur, barre rouge à gauche, trait et message rouges.
const CONTROL_CLASSES =
  "block w-full rounded-t px-4 py-2 text-base leading-6 bg-dsfr-grey-950 text-dsfr-grey-200 border-0 border-b-2 border-solid border-dsfr-grey-200 placeholder:text-dsfr-mention-grey placeholder:italic focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus disabled:text-dsfr-grey-625 disabled:border-dsfr-grey-925 disabled:cursor-not-allowed";
const CONTROL_ERROR_CLASSES = "border-dsfr-error-425";

type FieldShellProps = {
  label?: ReactNode;
  hint?: ReactNode;
  errorMessage?: ReactNode;
  required?: boolean;
  counter?: { length: number; max: number };
  className?: string;
};

const useFieldIds = (id?: string) => {
  const generated = useId();
  const controlId = id ?? generated;
  return {
    controlId,
    hintId: `${controlId}-hint`,
    errorId: `${controlId}-error`,
  };
};

const FieldShell = ({
  controlId,
  hintId,
  errorId,
  label,
  hint,
  errorMessage,
  required,
  counter,
  className,
  children,
}: FieldShellProps & {
  controlId: string;
  hintId: string;
  errorId: string;
  children: ReactNode;
}) => (
  <div
    className={clsxm(
      "relative flex flex-col",
      errorMessage &&
        "pl-3 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-dsfr-error-425",
      className,
    )}
  >
    {label ? (
      <Label.Root
        className={clsxm(
          "block text-base leading-6 text-dsfr-grey-50",
          errorMessage && "text-dsfr-error-425",
        )}
        htmlFor={controlId}
      >
        {label}
        {required ? <ChampObligatoire /> : null}
      </Label.Root>
    ) : null}
    {hint ? (
      <span className="text-xs leading-5 text-dsfr-mention-grey" id={hintId}>
        {hint}
      </span>
    ) : null}
    {children}
    {errorMessage || counter ? (
      <div className="flex justify-between gap-2 mt-2">
        {errorMessage ? (
          <p
            className="text-xs leading-5 text-dsfr-error-425 mb-0"
            id={errorId}
          >
            {errorMessage}
          </p>
        ) : (
          <span />
        )}
        {counter ? (
          <span className="text-xs leading-5 text-dsfr-mention-grey">
            {counter.length} / {counter.max}
          </span>
        ) : null}
      </div>
    ) : null}
  </div>
);

const describedBy = (
  hint: ReactNode,
  errorMessage: ReactNode,
  hintId: string,
  errorId: string,
) =>
  [hint ? hintId : null, errorMessage ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

export const TextField = ({
  id,
  label,
  hint,
  errorMessage,
  required,
  counter,
  className,
  inputClassName,
  ...props
}: ComponentProps<"input"> & FieldShellProps & { inputClassName?: string }) => {
  const ids = useFieldIds(id);
  return (
    <FieldShell
      {...ids}
      className={className}
      counter={counter}
      errorMessage={errorMessage}
      hint={hint}
      label={label}
      required={required}
    >
      <input
        aria-describedby={describedBy(
          hint,
          errorMessage,
          ids.hintId,
          ids.errorId,
        )}
        aria-invalid={errorMessage ? true : undefined}
        autoComplete="off"
        className={clsxm(
          CONTROL_CLASSES,
          (label || hint) && "mt-2",
          errorMessage && CONTROL_ERROR_CLASSES,
          inputClassName,
        )}
        id={ids.controlId}
        aria-required={required || undefined}
        {...props}
      />
    </FieldShell>
  );
};

export const TextareaField = ({
  id,
  label,
  hint,
  errorMessage,
  required,
  counter,
  className,
  textareaClassName,
  ...props
}: ComponentProps<"textarea"> &
  FieldShellProps & { textareaClassName?: string }) => {
  const ids = useFieldIds(id);
  return (
    <FieldShell
      {...ids}
      className={className}
      counter={counter}
      errorMessage={errorMessage}
      hint={hint}
      label={label}
      required={required}
    >
      <textarea
        aria-describedby={describedBy(
          hint,
          errorMessage,
          ids.hintId,
          ids.errorId,
        )}
        aria-invalid={errorMessage ? true : undefined}
        className={clsxm(
          CONTROL_CLASSES,
          (label || hint) && "mt-2",
          "min-h-24",
          errorMessage && CONTROL_ERROR_CLASSES,
          textareaClassName,
        )}
        id={ids.controlId}
        aria-required={required || undefined}
        {...props}
      />
    </FieldShell>
  );
};
