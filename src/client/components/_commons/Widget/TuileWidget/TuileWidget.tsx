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
    <div className="fr-card fr-p-3w max-w-[544px] flex flex-col gap-4">
      <span className="fr-text--xl font-bold fr-m-0">{titre}</span>
      {children}
    </div>
  );
};
