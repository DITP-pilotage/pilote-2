import { FunctionComponent, PropsWithChildren } from "react";
import { TitleBand } from "@/components/shared/TitleBand";
import { BoutonImpression } from "@/components/_commons/BoutonImpression/BoutonImpression";

export const EnteteFicheConducteur: FunctionComponent<
  PropsWithChildren<{ titleBandClassName?: string }>
> = ({ children, titleBandClassName }) => {
  return (
    <TitleBand className={titleBandClassName}>
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg mb-0 text-primary">{children}</h2>
        <BoutonImpression />
      </div>
    </TitleBand>
  );
};
