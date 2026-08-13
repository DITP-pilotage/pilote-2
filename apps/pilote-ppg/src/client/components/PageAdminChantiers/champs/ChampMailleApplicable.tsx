import { Controller, useFormContext } from "react-hook-form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";
import { MAILLES } from "@/server/metadataChantier/handlers/EnregistrerChantierHandler";

const ChampMailleApplicable = () => {
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="mailleApplicable"
      render={({ field, fieldState }) => (
        <div>
          <p className="italic text-xs font-medium mb-2">Maille applicable *</p>
          <div className="flex gap-6 items-center flex-wrap">
            {MAILLES.map((maille) => (
              <label
                key={maille}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={field.value.includes(maille)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...field.value, maille]
                      : field.value.filter((m) => m !== maille);
                    field.onChange(next);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{maille}</span>
              </label>
            ))}
            <Bouton
              label="Tout sélectionner"
              variant="link"
              size="sm"
              onClick={() => field.onChange(MAILLES)}
            />
            {field.value.length > 0 && (
              <Bouton
                label="Tout désélectionner"
                variant="link"
                size="sm"
                onClick={() => field.onChange([])}
              />
            )}
          </div>
          {fieldState.error && (
            <p className="text-xs text-red-500 mt-1">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default ChampMailleApplicable;
