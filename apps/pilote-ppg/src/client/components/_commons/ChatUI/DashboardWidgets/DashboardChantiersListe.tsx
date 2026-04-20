import { DashboardPanel } from "./DashboardPanel";
import { DashboardWidgetTitle } from "./DashboardWidgetTitle";

const METEO_LABELS: Record<string, string> = {
  SOLEIL: "☀️ Soleil",
  COUVERT: "🌤️ Couvert",
  NUAGE: "☁️ Nuage",
  ORAGE: "⛈️ Orage",
  NON_RENSEIGNEE: "—",
  NON_NECESSAIRE: "—",
};

export type DashboardChantierLigne = {
  id: string;
  nom: string;
  ecart: number | null;
  meteo: string | null;
};

const ChantierLigne = ({ id, nom, ecart, meteo }: DashboardChantierLigne) => (
  <li className="py-2 flex items-start justify-between gap-2">
    <div className="min-w-0">
      <div className="text-sm font-medium text-gray-900 truncate">
        {id} — {nom}
      </div>
      {ecart !== null ? (
        <div className="text-xs text-gray-500">
          Écart {ecart > 0 ? "+" : ""}
          {ecart} pts
        </div>
      ) : null}
    </div>
    <div className="text-xs text-gray-600 shrink-0">
      {meteo ? (METEO_LABELS[meteo] ?? meteo) : "—"}
    </div>
  </li>
);

export const DashboardChantiersListe = ({
  titre,
  territoireCode,
  lignes,
}: {
  titre: string;
  territoireCode: string;
  lignes: DashboardChantierLigne[];
}) => (
  <DashboardPanel>
    <DashboardWidgetTitle segments={[titre, territoireCode]} className="mb-3" />
    {lignes.length === 0 ? (
      <div className="text-sm text-gray-500">Aucun chantier signalé.</div>
    ) : (
      <ul className="divide-y divide-gray-100">
        {lignes.map((ligne) => (
          <ChantierLigne key={ligne.id} {...ligne} />
        ))}
      </ul>
    )}
  </DashboardPanel>
);
