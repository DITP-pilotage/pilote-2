import type {
  ComposeDashboardOutput,
  ResolvedWidget,
} from "@/server/albert/tools/composeDashboard";
import {
  DEFAULT_WIDTHS,
  type WidgetType,
} from "@/server/albert/tools/composeDashboardLayout";
import { ChantierIndicateursTable } from "@/components/_commons/ChatUI/ChantierIndicateursTable";

const WIDTH_TO_CLASS: Record<number, string> = {
  3: "col-span-12 md:col-span-3",
  4: "col-span-12 md:col-span-4",
  6: "col-span-12 md:col-span-6",
  8: "col-span-12 md:col-span-8",
  12: "col-span-12",
};

function resolveWidgetWidth(widget: ResolvedWidget): number {
  if (widget.kind === "error") {
    return 12;
  }
  const definition = widget.definition as { width?: number };
  return definition.width ?? DEFAULT_WIDTHS[widget.definition.type] ?? 12;
}

type SkeletonWidget = { type: string; width?: number };
type SkeletonContainer = { widgets: SkeletonWidget[] };

export const DashboardRender = ({
  output,
}: {
  output: ComposeDashboardOutput;
}) => {
  return (
    <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        {output.titre}
      </h3>
      <div className="space-y-3">
        {output.containers.map((container, containerIndex) => (
          <div key={containerIndex} className="grid grid-cols-12 gap-2">
            {container.widgets.map((widget, widgetIndex) => {
              const width = resolveWidgetWidth(widget);
              const innerClassName = WIDTH_TO_CLASS[width] ?? "col-span-12";
              return (
                <div key={widgetIndex} className={innerClassName}>
                  <DashboardWidget widget={widget} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardWidget = ({ widget }: { widget: ResolvedWidget }) => {
  if (widget.kind === "error") {
    return (
      <div className="h-full rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        {widget.message}
      </div>
    );
  }

  if (widget.kind === "kpi_card") {
    return (
      <KpiCardWidget
        territoireCode={widget.definition.territoire_code}
        jalon={widget.definition.jalon}
        label={widget.data.label}
        value={widget.data.value}
      />
    );
  }

  if (widget.kind === "tableau_indicateurs") {
    return (
      <TableauIndicateursWidget
        chantierId={widget.definition.chantier_id}
        territoireCode={widget.definition.territoire_code}
        indicateurs={widget.data.indicateurs}
      />
    );
  }

  if (widget.kind === "liste_chantiers_alerte") {
    return (
      <ListeChantiersAlerteWidget
        territoireCode={widget.definition.territoire_code}
        data={widget.data}
      />
    );
  }

  if (widget.kind === "texte_section") {
    return (
      <TexteSectionWidget
        titre={widget.definition.titre}
        description={widget.definition.description}
      />
    );
  }

  if (widget.kind === "filler") {
    return <FillerWidget />;
  }

  return null;
};

const KpiCardWidget = ({
  territoireCode,
  jalon,
  label,
  value,
}: {
  territoireCode: string;
  jalon: number;
  label: string;
  value: string;
}) => {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-3xl font-semibold text-gray-900 mt-2">{value}</div>
      <div className="text-xs text-gray-500 mt-2">
        {territoireCode} · jalon {jalon}
      </div>
    </div>
  );
};

const TableauIndicateursWidget = ({
  chantierId,
  territoireCode,
  indicateurs,
}: {
  chantierId: string;
  territoireCode: string;
  indicateurs: Extract<
    ResolvedWidget,
    { kind: "tableau_indicateurs" }
  >["data"]["indicateurs"];
}) => {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
        Indicateurs · {chantierId} · {territoireCode}
      </div>
      {indicateurs.length === 0 ? (
        <div className="text-sm text-gray-500">
          Aucun indicateur disponible.
        </div>
      ) : (
        <ChantierIndicateursTable indicateurs={indicateurs} />
      )}
    </div>
  );
};

const METEO_LABELS: Record<string, string> = {
  SOLEIL: "☀️ Soleil",
  COUVERT: "🌤️ Couvert",
  NUAGE: "☁️ Nuage",
  ORAGE: "⛈️ Orage",
  NON_RENSEIGNEE: "—",
  NON_NECESSAIRE: "—",
};

const ListeChantiersAlerteWidget = ({
  territoireCode,
  data,
}: {
  territoireCode: string;
  data: Extract<ResolvedWidget, { kind: "liste_chantiers_alerte" }>["data"];
}) => {
  const titre =
    data.type_alerte === "retard"
      ? "Chantiers en retard"
      : "Chantiers en difficulté";

  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
        {titre} · {territoireCode}
      </div>
      {data.chantiers.length === 0 ? (
        <div className="text-sm text-gray-500">Aucun chantier signalé.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.chantiers.map((chantier) => (
            <ChantierAlerteLigne
              key={chantier.id}
              id={chantier.id}
              nom={chantier.nom}
              ecart={chantier.ecart}
              meteo={chantier.meteo}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const ChantierAlerteLigne = ({
  id,
  nom,
  ecart,
  meteo,
}: {
  id: string;
  nom: string;
  ecart: number | null;
  meteo: string | null;
}) => {
  return (
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
};

const TexteSectionWidget = ({
  titre,
  description,
}: {
  titre: string;
  description: string | undefined;
}) => {
  return (
    <div className="h-full py-2 mt-3">
      <h4 className="text-base font-semibold text-gray-900 fr-mb-0">{titre}</h4>
      {description ? (
        <p className="text-sm text-gray-600 mt-1 fr-mb-0">{description}</p>
      ) : null}
    </div>
  );
};

const FillerWidget = () => {
  return <div aria-hidden="true" />;
};

const FALLBACK_CONTAINERS: SkeletonContainer[] = [
  {
    widgets: [
      { type: "kpi_card" },
      { type: "kpi_card" },
      { type: "kpi_card" },
      { type: "kpi_card" },
    ],
  },
  {
    widgets: [{ type: "liste_chantiers_alerte" }],
  },
  {
    widgets: [{ type: "tableau_indicateurs" }],
  },
];

function extractSkeletonContainers(input: unknown): SkeletonContainer[] {
  if (typeof input !== "object" || input === null) return FALLBACK_CONTAINERS;
  const containers = (input as { containers?: unknown }).containers;
  if (!Array.isArray(containers) || containers.length === 0) {
    return FALLBACK_CONTAINERS;
  }
  return containers.map((container) => {
    if (typeof container !== "object" || container === null) {
      return { widgets: [{ type: "kpi_card" }] };
    }
    const record = container as Record<string, unknown>;
    const rawWidgets = Array.isArray(record.widgets) ? record.widgets : [];
    const widgets: SkeletonWidget[] =
      rawWidgets.length > 0
        ? rawWidgets.map((widget) => {
            if (typeof widget !== "object" || widget === null) {
              return { type: "kpi_card" };
            }
            const widgetRecord = widget as Record<string, unknown>;
            return {
              type:
                typeof widgetRecord.type === "string"
                  ? widgetRecord.type
                  : "kpi_card",
              width:
                typeof widgetRecord.width === "number"
                  ? widgetRecord.width
                  : undefined,
            };
          })
        : [{ type: "kpi_card" }];
    return { widgets };
  });
}

function extractSkeletonTitre(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const titre = (input as { titre?: unknown }).titre;
  return typeof titre === "string" && titre.length > 0 ? titre : undefined;
}

export const DashboardSkeleton = ({ input }: { input: unknown }) => {
  const containers = extractSkeletonContainers(input);
  const titre = extractSkeletonTitre(input);

  return (
    <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
      {titre ? (
        <h3 className="text-base font-semibold text-gray-900 mb-3">{titre}</h3>
      ) : (
        <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
      )}
      <div className="space-y-3">
        {containers.map((container, containerIndex) => (
          <div key={containerIndex} className="grid grid-cols-12 gap-2">
            {container.widgets.map((widget, widgetIndex) => {
              const widgetWidth =
                widget.width ?? DEFAULT_WIDTHS[widget.type as WidgetType] ?? 12;
              const innerClassName =
                WIDTH_TO_CLASS[widgetWidth] ?? "col-span-12";
              return (
                <div key={widgetIndex} className={innerClassName}>
                  <WidgetSkeleton type={widget.type} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const WidgetSkeleton = ({ type }: { type: string }) => {
  if (type === "filler") {
    return <div aria-hidden="true" />;
  }

  if (type === "texte_section") {
    return (
      <div className="h-full py-2 mt-3">
        <div className="h-4 w-40 bg-gray-300 rounded" />
        <div className="h-3 w-64 bg-gray-200 rounded mt-2" />
      </div>
    );
  }

  if (type === "kpi_card") {
    return (
      <div className="h-full min-h-[110px] rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-300 rounded mt-2" />
        <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
      </div>
    );
  }

  if (type === "tableau_indicateurs") {
    return (
      <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
        <div className="h-3 w-32 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-4 w-full bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (type === "liste_chantiers_alerte") {
    return (
      <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
        <div className="h-3 w-32 bg-gray-200 rounded mb-3" />
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row}>
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[110px] rounded-lg border border-gray-200 bg-white p-4">
      <div className="h-4 w-32 bg-gray-200 rounded" />
    </div>
  );
};
