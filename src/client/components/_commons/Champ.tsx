import { FunctionComponent } from "react";

const Champ: FunctionComponent<{
  label: string;
  valeur: string | null | undefined;
}> = ({ label, valeur }) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p
      className="text-sm font-bold text-gray-900 truncate mb-0"
      title={valeur ?? undefined}
    >
      {valeur || "-"}
    </p>
  </div>
);

export default Champ;
