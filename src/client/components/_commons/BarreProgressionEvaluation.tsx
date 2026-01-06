import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { Tooltip } from "@/components/shared/Tooltip";

export const BarreProgressionEvaluation = ({
  peutEtreTransmis = true,
  estVerrouille = false,
  texteProgression = "Progression",
  elementDeProgression,
  estValide,
  nombreTotal,
  nombreNotes,
}: {
  peutEtreTransmis?: boolean;
  estVerrouille?: boolean;
  texteProgression?: string;
  elementDeProgression: "axes" | "objectifs";
  estValide: boolean;
  nombreTotal: number;
  nombreNotes: number;
}) => {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
        {estVerrouille ? (
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Icone className="w-4 h-4" icone={LockIcon} />
            </Tooltip.Trigger>
            <Tooltip.Content>
              Les appréciations ont été transmises pour instruction en
              administration centrale. Elles sont consultables mais plus
              modifiables.
            </Tooltip.Content>
          </Tooltip.Root>
        ) : null}
        {`${texteProgression} : ${nombreNotes} / ${nombreTotal} ${elementDeProgression}${!estValide && peutEtreTransmis && nombreNotes === nombreTotal ? " - à transmettre" : ""}`}
      </div>
      {nombreTotal > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={clsxm("h-2 rounded-full", {
              "bg-primary": estValide,
              "bg-warning": !estValide,
            })}
            style={{
              width: `${(nombreNotes / nombreTotal) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
