import { FunctionComponent, ReactNode } from "react";

interface FiltresGroupeProps {
  libellé?: string;
  children: ReactNode;
}

const FiltresGroupe: FunctionComponent<FiltresGroupeProps> = ({
  libellé,
  children,
}) => {
  return (
    <section className="px-6">
      {!!libellé && (
        <h2 className="fr-text--lg mt-4 mb-2 font-bold">{libellé}</h2>
      )}
      {children}
    </section>
  );
};

export default FiltresGroupe;
