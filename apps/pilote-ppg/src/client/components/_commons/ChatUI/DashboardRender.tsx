import { Suspense, useRef } from "react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import type {
  ComposeDashboardOutput,
  WidgetDefinition,
} from "@/server/albert/tools/composeDashboard";
import { DEFAULT_WIDTHS } from "@/server/albert/tools/composeDashboardLayout";
import { ColonneMesuree } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { ActionReponse } from "@/components/_commons/ChatUI/ActionReponse";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
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
  const contenuRef = useRef<HTMLDivElement>(null);

  const copierImage = async () => {
    const element = contenuRef.current;
    if (element == null) return;

    const blob = await toBlob(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    if (blob == null) return;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast.success("Image copiée dans le presse-papiers", { duration: 3000 });
  };

  return (
    <div className="border border-dsfr-grey-900 bg-white">
      <div className="flex h-11 items-center gap-2.5 border-b border-dsfr-grey-900 bg-dsfr-grey-1000 pl-4 pr-2">
        <h3 className="truncate text-sm font-bold leading-5 text-dsfr-grey-50 fr-mb-0">
          {output.titre}
        </h3>
        <span className="flex-1" />
        <ActionReponse
          icone={ClipboardIcon}
          label="Copier l'image"
          onClick={copierImage}
        />
      </div>
      <div className="bg-white p-3" ref={contenuRef}>
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
