import { clsxm } from "@/utils/clsxm";

export const BarreProgressionEvaluation = ({
  peutEtreTransmis = true,
  estValide,
  nombreTotal,
  nombreNotes,
}: {
  peutEtreTransmis?: boolean;
  estValide: boolean;
  nombreTotal: number;
  nombreNotes: number;
}) => {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-2">
        {`Progression : ${nombreNotes} / ${nombreTotal} axes${!estValide && peutEtreTransmis && nombreNotes === nombreTotal ? " - à transmettre" : ""}`}
      </div>
      {nombreTotal > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={clsxm("h-2 rounded-full", {
              "bg-primary": estValide,
              "bg-pilote-yellow": !estValide,
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
