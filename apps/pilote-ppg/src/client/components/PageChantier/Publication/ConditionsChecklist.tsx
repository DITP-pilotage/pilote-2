import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { clsxm } from "@/utils/clsxm";
import { ActionCondition } from "./actionConditions";

export const ConditionsChecklist = ({
  id,
  title,
  conditions,
}: {
  id: string;
  title: string;
  conditions: ActionCondition[];
}) => (
  <div aria-live="polite" id={id}>
    <p className="text-xs font-bold mb-0.5">{title}</p>
    <ul className="list-none p-0 m-0">
      {conditions.map(({ field, label, met }) => (
        <li
          className={clsxm(
            "flex items-start gap-1 p-0 text-xs leading-5",
            met ? "text-dsfr-success-425" : "text-dsfr-error-425",
          )}
          key={field}
        >
          <Icone
            className="w-3 h-3 mt-1 flex-none text-current"
            icone={met ? CheckLineIcon : CloseLineIcon}
          />
          <span>
            {label}
            <span className="sr-only">{met ? " : fait" : " : à faire"}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);
