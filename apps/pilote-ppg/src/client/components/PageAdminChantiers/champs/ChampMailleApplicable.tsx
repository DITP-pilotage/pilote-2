import { FunctionComponent } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierMutations";

const MAILLES = ["NAT", "REG", "DEPT"] as const;

const ChampMailleApplicable: FunctionComponent = () => {
  const { control, watch } = useFormContext<ChantierForm>();
  const mailleApplicable = watch("mailleApplicable");

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
            <button
              type="button"
              className="text-xs text-blue-600 underline hover:no-underline"
              onClick={() => field.onChange(["NAT", "REG", "DEPT"])}
            >
              Tout sélectionner
            </button>
            {mailleApplicable.length > 0 && (
              <button
                type="button"
                className="text-xs text-gray-500 underline hover:no-underline"
                onClick={() => field.onChange([])}
              >
                Tout désélectionner
              </button>
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
