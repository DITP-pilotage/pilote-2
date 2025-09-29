import { FunctionComponent, PropsWithChildren } from "react";
import Encart from "@/components/_commons/Encart/Encart";
import Titre from "@/components/_commons/Titre/Titre";
import { BoutonImpression } from "@/components/_commons/BoutonImpression/BoutonImpression";

export const EnteteFicheConducteur: FunctionComponent<
  PropsWithChildren<{}>
> = ({ children }) => {
  return (
    <Encart>
      <div className="flex justify-between align-center gap-2">
        <Titre baliseHtml="h2" className="!text-lg !mb-0 !text-primary">
          {children}
        </Titre>
        <BoutonImpression />
      </div>
    </Encart>
  );
};
