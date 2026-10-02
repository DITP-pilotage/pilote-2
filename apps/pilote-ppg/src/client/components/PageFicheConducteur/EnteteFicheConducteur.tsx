import { FunctionComponent, PropsWithChildren } from "react";
import { TitleBand } from "@/components/shared/TitleBand";
import Titre from "@/components/_commons/Titre/Titre";
import { BoutonImpression } from "@/components/_commons/BoutonImpression/BoutonImpression";

export const EnteteFicheConducteur: FunctionComponent<
  PropsWithChildren<{ titleBandClassName?: string }>
> = ({ children, titleBandClassName }) => {
  return (
    <TitleBand className={titleBandClassName}>
      <div className="flex justify-between align-center gap-2">
        <Titre baliseHtml="h2" className="!text-lg !mb-0 !text-primary">
          {children}
        </Titre>
        <BoutonImpression />
      </div>
    </TitleBand>
  );
};
