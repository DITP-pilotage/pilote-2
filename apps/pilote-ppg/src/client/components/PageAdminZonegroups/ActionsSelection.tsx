import type { ZoneDisponible } from "@/server/metadataZonegroup/queries/ListerZonesDisponiblesQuery";
import { Bouton } from "@/components/_commons/Bouton/Bouton";

const BoutonAction = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <Bouton
    label={label}
    onClick={onClick}
    size="sm"
    type="button"
    variant="secondary"
  />
);

export const ActionsSelection = ({
  zones,
  selection,
  onChange,
}: {
  zones: ZoneDisponible[];
  selection: string[];
  onChange: (ids: string[]) => void;
}) => {
  const toutCocher = () => {
    const ids = zones.map((zone) => zone.zoneId);
    const current = new Set(selection);
    ids.forEach((id) => current.add(id));
    onChange(Array.from(current));
  };

  const toutDécocher = () => {
    const ids = new Set(zones.map((zone) => zone.zoneId));
    onChange(selection.filter((id) => !ids.has(id)));
  };

  return (
    <div className="flex gap-2">
      <BoutonAction label="Tout cocher" onClick={toutCocher} />
      <BoutonAction label="Tout décocher" onClick={toutDécocher} />
    </div>
  );
};
