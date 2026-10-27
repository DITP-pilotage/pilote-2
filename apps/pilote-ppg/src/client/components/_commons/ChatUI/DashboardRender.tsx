import { Suspense } from "react";
import type {
  ComposeDashboardOutput,
  WidgetDefinition,
} from "@/server/albert/tools/composeDashboard";
import { DEFAULT_WIDTHS } from "@/server/albert/tools/composeDashboardLayout";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { markCopyableDashboard } from "@/components/_commons/ChatUI/copyResponse";
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
}) => {
  return (
    <div
      className="border border-dsfr-grey-900 bg-white"
      {...markCopyableDashboard()}
    >
      <div className="flex h-11 items-center border-b border-dsfr-grey-900 bg-dsfr-grey-1000 pl-4 pr-2">
        <h3 className="truncate text-sm font-bold leading-5 text-dsfr-grey-50 mb-0">
          {output.titre}
        </h3>
      </div>
      <div className="bg-white p-3">
        <Suspense fallback={<DashboardLoader />}>
          <div className="flex flex-col gap-3">
            {output.containers.map((container, containerIndex) => (
              <div className="grid grid-cols-4 gap-3" key={containerIndex}>
                {container.widgets.map((widget, widgetIndex) => {
                  const width = resolveWidgetWidth(widget);
                  const innerClassName = WIDTH_TO_CLASS[width] ?? "col-span-4";
                  return (
                    <div
                      className={clsxm("h-full", innerClassName)}
                      key={widgetIndex}
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
    </div>
  );
};
