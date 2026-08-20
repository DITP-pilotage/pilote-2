import { useState } from "react";
import type { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";
import type { ZoneDisponible } from "@/server/metadataZonegroup/queries/ListerZonesDisponiblesQuery";
import { InputRecherche } from "@/components/_commons/InputRecherche/InputRecherche";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import Alerte from "@/components/_commons/Alerte/Alerte";

const LABELS_TYPE: Record<MailleTerritoireSelectionne, string> = {
  NAT: "National",
  REG: "Région",
  DEPT: "Département",
};

const ORDRE_TYPES: MailleTerritoireSelectionne[] = ["NAT", "REG", "DEPT"];

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

interface Props {
  zonesDisponibles: ZoneDisponible[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export const SélecteurZones = ({
  zonesDisponibles,
  value,
  onChange,
  error,
}: Props) => {
  const [filtreZone, setFiltreZone] = useState("");

  const zonesGroupées = zonesDisponibles.reduce<
    Record<MailleTerritoireSelectionne, ZoneDisponible[]>
  >(
    (acc, zone) => {
      const type = zone.zoneType as MailleTerritoireSelectionne;
      if (!acc[type]) acc[type] = [];
      acc[type].push(zone);
      return acc;
    },
    { NAT: [], REG: [], DEPT: [] },
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          {value.length} zone{value.length !== 1 ? "s" : ""} sélectionnée
          {value.length !== 1 ? "s" : ""}
        </p>
        <InputRecherche
          className="w-64"
          onChange={setFiltreZone}
          placeholder="Filtrer les zones…"
          value={filtreZone}
        />
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-sm p-4">
        {ORDRE_TYPES.map((type) => {
          const zones = zonesGroupées[type].filter(
            (zone) =>
              !filtreZone ||
              zone.zoneId.toLowerCase().includes(filtreZone.toLowerCase()) ||
              zone.nom.toLowerCase().includes(filtreZone.toLowerCase()),
          );
          if (zones.length === 0) return null;
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {LABELS_TYPE[type]}
                </h4>
                <div className="flex gap-2">
                  <BoutonAction
                    label="Tout cocher"
                    onClick={() => {
                      const ids = zones.map((zone) => zone.zoneId);
                      const current = new Set(value);
                      ids.forEach((id) => current.add(id));
                      onChange(Array.from(current));
                    }}
                  />
                  <BoutonAction
                    label="Tout décocher"
                    onClick={() => {
                      const ids = new Set(zones.map((zone) => zone.zoneId));
                      onChange(value.filter((id) => !ids.has(id)));
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {zones.map((zone) => (
                  <label
                    className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm"
                    key={zone.zoneId}
                  >
                    <input
                      checked={value.includes(zone.zoneId)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      onChange={(event) => {
                        onChange(
                          event.target.checked
                            ? [...value, zone.zoneId]
                            : value.filter((id) => id !== zone.zoneId),
                        );
                      }}
                      type="checkbox"
                    />
                    <span className="font-mono text-xs text-gray-500 w-12 shrink-0">
                      {zone.zoneId}
                    </span>
                    <span className="text-gray-700 truncate">{zone.nom}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {error && <Alerte message={error} type="erreur" />}
    </div>
  );
};
