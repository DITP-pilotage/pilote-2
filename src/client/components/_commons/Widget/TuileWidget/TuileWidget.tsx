import { FunctionComponent, ReactNode } from "react";

type TuileWidgetProps = {
  titre: string;
  children: ReactNode;
};

export const TuileWidget: FunctionComponent<TuileWidgetProps> = ({
  titre,
  children,
}) => {
  return (
    <div className="fr-card fr-p-3w">
      <h4 className="fr-text--bold fr-mb-2w">{titre}</h4>
      {children}
    </div>
  );
};
