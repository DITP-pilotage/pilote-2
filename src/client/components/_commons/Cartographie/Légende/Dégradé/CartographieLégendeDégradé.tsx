import { FunctionComponent } from "react";
import { CartographieLégendeDégradéContenu } from "./CartographieLégendeDégradé.interface";

interface CartographieLégendeDégradéProps {
  contenu: CartographieLégendeDégradéContenu;
}

const CartographieLégendeDégradé: FunctionComponent<
  CartographieLégendeDégradéProps
> = ({ contenu }) => {
  return (
    <div className="max-w-[25rem] mx-auto fr-mt-1w">
      <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">
        {contenu.libellé}
      </p>
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${contenu.couleurMin}, ${contenu.couleurMax})`,
        }}
      />
      <div className="flex justify-between">
        <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">
          {contenu.valeurMin}
        </p>
        <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-0">
          {contenu.valeurMax}
        </p>
      </div>
    </div>
  );
};

export default CartographieLégendeDégradé;
