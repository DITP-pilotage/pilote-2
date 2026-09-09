import { Squelette } from "@/components/_commons/ChatUI/Squelette";
import { LoaderIcon } from "@/components/_commons/Icones/LoaderIcon";

export const DashboardLoader = () => (
  <div className="border border-dsfr-grey-900 bg-white">
    <div className="flex h-11 items-center gap-2.5 border-b border-dsfr-grey-900 bg-dsfr-grey-1000 px-4 text-sm font-medium text-dsfr-mention-grey">
      <span>Composition du tableau de bord…</span>
      <span className="flex-1" />
      <LoaderIcon
        className="h-4 w-4 animate-spin text-primary"
        fill="currentColor"
      />
    </div>
    <div className="grid grid-cols-4 gap-3 p-3">
      <Squelette className="h-[88px]" />
      <Squelette className="h-[88px]" />
      <Squelette className="h-[88px]" />
      <Squelette className="h-[88px]" />
      <Squelette className="col-span-4 h-[120px]" />
    </div>
  </div>
);
