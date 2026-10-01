import { forwardRef } from "react";
import {
  libellesMeteos,
  MeteoSaisissable,
  meteosSaisissables,
} from "@/server/domain/météo/Météo.interface";
import { MeteoComponentMap } from "@/components/_commons/Meteo/Picto/MeteoPicto";

export const SelecteurMeteo = forwardRef<
  HTMLDivElement,
  {
    value?: MeteoSaisissable;
    onChange: (meteo: MeteoSaisissable) => void;
    onBlur?: () => void;
  }
>(({ value, onChange, onBlur }, ref) => {
  return (
    <div
      className="grid grid-cols-2 gap-2"
      onBlur={onBlur}
      ref={ref}
      tabIndex={-1}
    >
      {meteosSaisissables.map((météo) => {
        const IconComponent = MeteoComponentMap[météo];
        const isSelected = value === météo;

        return (
          <button
            className={`flex flex-col items-center gap-1 p-3 rounded border transition-colors ${
              isSelected
                ? "border-dsfr-moutarde-main-850"
                : "border-dsfr-grey-925"
            }`}
            key={météo}
            onClick={() => onChange(météo)}
            type="button"
          >
            <div className={isSelected ? "" : "grayscale opacity-50"}>
              {IconComponent && <IconComponent className="h-10 w-10" />}
            </div>
            <span
              className={`text-xs text-center ${isSelected ? "text-black" : "text-dsfr-mention-grey "}`}
            >
              {libellesMeteos[météo]}
            </span>
          </button>
        );
      })}
    </div>
  );
});

SelecteurMeteo.displayName = "SelecteurMeteo";
