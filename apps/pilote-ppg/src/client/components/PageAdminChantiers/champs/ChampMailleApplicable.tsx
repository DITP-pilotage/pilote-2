import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";
import { MAILLES, Maille } from "@/server/metadataChantier/domain/maille";

export function maillesAttendues(
  chTerrito: boolean,
  mailleApplicable: readonly Maille[],
): Maille[] {
  if (!chTerrito) return ["NAT"];
  return mailleApplicable.includes("DEPT")
    ? ["NAT", "REG", "DEPT"]
    : ["NAT", "REG"];
}

const ChampMailleApplicable = () => {
  const form = useFormContext<ChantierForm>();
  const chTerrito = useWatch({ control: form.control, name: "chTerrito" });

  return (
    <Controller
      control={form.control}
      name="mailleApplicable"
      render={({ field, fieldState }) => (
        <div>
          <p className="italic text-xs font-medium mb-2">Maille applicable *</p>
          <div className="flex gap-6 items-center flex-wrap">
            {MAILLES.map((maille) => {
              const estDesactivee = maille !== "DEPT" || !chTerrito;
              return (
                <label
                  key={maille}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={field.value.includes(maille)}
                    disabled={estDesactivee}
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
              );
            })}
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
