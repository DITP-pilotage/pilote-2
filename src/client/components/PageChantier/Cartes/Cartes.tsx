import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import CartesStyled from "@/components/PageChantier/Cartes/Cartes.styled";
import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import Alerte from "@/components/_commons/Alerte/Alerte";
import CartographieAvecSelecteur from "@/components/_commons/Cartographie/CartographieAvecSelecteur/CartographieAvecSelecteur";
import { TerritoiresDonnées } from "@/server/domain/territoire/Territoire.interface";

export type CartographieType =
  | "avancementMandat"
  | "avancementJalon"
  | "meteo"
  | "propositionValeur";
interface CartesProps {
  chantierMailles: Record<Maille, TerritoiresDonnées>;
  afficheCarteAvancement: boolean;
  afficheCarteMétéo: boolean;
  estInteractif?: boolean;
  territoireCode: string;
  jalon: number;
  mailleQuery: MailleInterne;
  mailleSourceDonnees?: Maille | null;
  cartographieGaucheChantier: CartographieType;
  cartographieDroiteChantier: CartographieType;
}

const Cartes: FunctionComponent<CartesProps> = ({
  chantierMailles,
  afficheCarteAvancement,
  afficheCarteMétéo,
  estInteractif = true,
  territoireCode,
  jalon,
  mailleQuery,
  mailleSourceDonnees,
  cartographieGaucheChantier,
  cartographieDroiteChantier,
}) => {
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
                chantierMailles={chantierMailles}
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
                chantierMailles={chantierMailles}
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
