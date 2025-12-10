import "@gouvfr/dsfr/dist/component/form/form.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import { FunctionComponent, PropsWithChildren } from "react";
import { clsxm } from "@/utils/clsxm";

const TextArea: FunctionComponent<
  PropsWithChildren<{
    htmlName: string;
    erreurMessage: string | undefined;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
  }>
> = ({
  children,
  erreurMessage,
  value,
  onChange,
  htmlName,
  disabled = false,
  className = "",
}) => {
  return (
    <div
      className={clsxm("fr-input-group", {
        "fr-input-group--error": erreurMessage,
      })}
    >
      {children}
      <textarea
        className={clsxm(
          `fr-input`,
          {
            "fr-input-group--error": erreurMessage,
          },
          className,
        )}
        disabled={disabled}
        id={htmlName}
        onChange={(event) => {
          onChange?.(event.target.value);
        }}
        value={value}
      />
      {erreurMessage !== undefined ? (
        <p className="fr-error-text fr-mt-1v">{erreurMessage?.toString()}</p>
      ) : null}
    </div>
  );
};

export default TextArea;
