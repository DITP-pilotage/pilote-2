import { Suspense } from "react";
import type {
  ComposeDashboardOutput,
  WidgetDefinition,
} from "@/server/albert/tools/composeDashboard";
import { DEFAULT_WIDTHS } from "@/server/albert/tools/composeDashboardLayout";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { clsxm } from "@/utils/clsxm";
import { DashboardWidgetRegistry } from "./DashboardWidgets/DashboardWidgetRegistry";
import { DashboardWidgetErrorBoundary } from "./DashboardWidgets/DashboardWidgetErrorBoundary";
import { DashboardLoader } from "./DashboardWidgets/DashboardLoader";

const WIDTH_TO_CLASS: Record<number, string> = {
  1: "col-span-4 md:col-span-1",
  2: "col-span-4 md:col-span-2",
  3: "col-span-4 md:col-span-3",
  4: "col-span-4",
};

const resolveWidgetWidth = (widget: WidgetDefinition): number => {
  if ("width" in widget && widget.width !== undefined) {
    return widget.width;
  }
  return DEFAULT_WIDTHS[widget.type] ?? 4;
};

export const DashboardRender = ({
  output,
}: {
  output: ComposeDashboardOutput;
}) => (
  <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
    <h3 className="text-base font-semibold text-gray-900 mb-3">
      {output.titre}
    </h3>
    <Suspense fallback={<DashboardLoader />}>
      <div className="space-y-3">
        {output.containers.map((container, containerIndex) => (
          <div key={containerIndex} className="grid grid-cols-4 gap-2">
            {container.widgets.map((widget, widgetIndex) => {
              const width = resolveWidgetWidth(widget);
              const innerClassName = WIDTH_TO_CLASS[width] ?? "col-span-4";
              return (
                <div
                  key={widgetIndex}
                  className={clsxm("h-full", innerClassName)}
                >
                  <DashboardWidgetErrorBoundary>
                    <ColonneMesuree className="h-full">
                      <DashboardWidgetRegistry widget={widget} />
                    </ColonneMesuree>
                  </DashboardWidgetErrorBoundary>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Suspense>
  </div>
);
