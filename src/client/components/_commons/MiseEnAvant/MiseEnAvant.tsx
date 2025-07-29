import { FunctionComponent, PropsWithChildren } from "react";
import "@gouvfr/dsfr/dist/component/callout/callout.min.css";

export const MiseEnAvant: FunctionComponent<
  PropsWithChildren<{
    titre: string;
    icone?: "question" | "information";
  }>
> = ({ titre, children, icone = "question" }) => {
  return (
    <div className="fr-callout fr-px-2w fr-pt-1w fr-pb-0 fr-m-0">
      <h3 className="fr-callout__title fr-text--md fr-text-title--blue-france">
        <span className={`fr-icon-${icone}-fill fr-mr-1w`} />
        {titre}
      </h3>
      <div className="fr-callout__text fr-text--sm fr-pl-4w">{children}</div>
    </div>
  );
};
