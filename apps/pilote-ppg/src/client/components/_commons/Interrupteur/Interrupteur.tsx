import "@gouvfr/dsfr/dist/component/toggle/toggle.min.css";
import { FunctionComponent, useId } from "react";
import { clsxm } from "@/utils/clsxm";
import { Switch } from "@/components/shared/Switch";

interface InterrupteurProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  libellé: string;
  messageSecondaire?: string;
  direction?: "initial" | "inverse";
  className?: string;
}

const Interrupteur: FunctionComponent<InterrupteurProps> = ({
  checked,
  libellé,
  onChange,
  messageSecondaire,
  direction,
  className,
}) => {
  const id = useId();
  return (
    <div className="flex flex-col">
      <div
        className={clsxm(
          "flex flex-row gap-2 items-center",
          {
            "!flex-row-reverse": direction === "inverse",
          },
          className,
        )}
      >
        <Switch.Root checked={checked} id={id} onCheckedChange={onChange}>
          <Switch.Thumb />
        </Switch.Root>

        <label
          className={clsxm("text-sm", {
            "text-primary": checked,
          })}
          htmlFor={id}
        >
          {libellé}
        </label>
      </div>
      {messageSecondaire ? (
        <p className="fr-hint-text" id="toggle-698-hint-text">
          {messageSecondaire}
        </p>
      ) : null}
    </div>
  );
};

export default Interrupteur;
