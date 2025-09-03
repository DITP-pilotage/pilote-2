import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import CartesStyled from "@/components/PageChantier/Cartes/Cartes.styled";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Alerte from "@/components/_commons/Alerte/Alerte";
import CartographieAvecSelecteur from "@/components/_commons/Cartographie/CartographieAvecSelecteur/CartographieAvecSelecteur";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

export type CartographieType =
  | "avancementMandat"
  | "avancementJalon"
  | "meteo"
  | "propositionValeur";
interface CartesProps {
  afficheCarteAvancement: boolean;
  afficheCarteMétéo: boolean;
  estInteractif?: boolean;
  mailleSourceDonnees?: Maille | null;
}

const Cartes: FunctionComponent<CartesProps> = ({
  afficheCarteAvancement,
  afficheCarteMétéo,
  estInteractif = true,
  mailleSourceDonnees,
}) => {
  const {
    chantier,
    jalon,
    mailleQuery,
    territoireCode,
    cartographieGaucheChantier,
    cartographieDroiteChantier,
  } = pageChantier.useServerSidePropsContext();
  const [, setCartographieGaucheSelection] = useQueryState(
    "carteChG",
    parseAsString.withDefault("avancementMandat").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  const [, setCartographieDroiteSelection] = useQueryState(
    "carteChD",
    parseAsString.withDefault("meteo").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  return (
    <CartesStyled>
      {afficheCarteAvancement ? (
        <div className="carte">
          <Bloc>
            <section>
              <CartographieAvecSelecteur
                aLaSelectionCartographie={(valeur: CartographieType) =>
                  setCartographieGaucheSelection(valeur)
                }
                cartographieSelectionnee={cartographieGaucheChantier}
                chantierMailles={chantier.mailles}
                estInteractif={estInteractif}
                jalon={jalon}
                listeCartographiesDesactives={[cartographieDroiteChantier]}
                mailleQuery={mailleQuery}
                territoireCode={territoireCode}
              />
              {mailleSourceDonnees === "regionale" && (
                <Alerte
                  classesSupplementaires="fr-mt-2w"
                  message="Données régionales"
                  type="info"
                />
              )}
            </section>
          </Bloc>
        </div>
      ) : null}
      {afficheCarteMétéo ? (
        <div className="carte">
          <Bloc>
            <section>
              <CartographieAvecSelecteur
                aLaSelectionCartographie={(valeur: CartographieType) =>
                  setCartographieDroiteSelection(valeur)
                }
                cartographieSelectionnee={cartographieDroiteChantier}
                chantierMailles={chantier.mailles}
                estInteractif={estInteractif}
                jalon={jalon}
                listeCartographiesDesactives={[cartographieGaucheChantier]}
                mailleQuery={mailleQuery}
                territoireCode={territoireCode}
              />
            </section>
          </Bloc>
        </div>
      ) : null}
    </CartesStyled>
  );
};

export default Cartes;
