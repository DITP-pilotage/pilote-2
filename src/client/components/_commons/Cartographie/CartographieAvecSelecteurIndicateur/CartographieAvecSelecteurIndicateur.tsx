import { FunctionComponent } from "react";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import Sélecteur from "@/client/components/_commons/Sélecteur/Sélecteur";
import { SélecteurOption } from "@/client/components/_commons/Sélecteur/Sélecteur.interface";
import Cartographie from "@/components/_commons/Cartographie/Cartographie";
import CartographieLégendeListe from "@/client/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe";
import { CartographieÉlémentDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { DétailsIndicateurTerritoire } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS } from "@/client/constants/légendes/elementDeLegendesCartographiePropositionValeur";
import { ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE } from "@/client/constants/légendes/élémentsDeLégendesCartographieValeurAvancement";
import { CartographieLégendeDégradéContenu } from "@/client/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé.interface";
import CartographieLégendeDégradé from "@/client/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé";
import { CartographieIndicateurType } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails";
import { useCartographieAvancementIndicateur } from "./useCartographieAvancementIndicateur";
import { useCartographiePropositionValeurIndicateur } from "./useCartographiePropositionValeurIndicateur";
import { useCartographieValeurAvancementIndicateur } from "./useCartographieValeurAvancementIndicateur";

const CartographieAvecSelecteurIndicateur: FunctionComponent<{
  detailsIndicateurTerritoire: DétailsIndicateurTerritoire;
  territoireCode: string;
  mailleQuery: MailleInterne;
  jalon: number;
  cartographieSelectionnee: CartographieIndicateurType;
  aLaSelectionCartographie: (valeur: CartographieIndicateurType) => void;
  listeCartographiesDesactives: CartographieIndicateurType[];
  unité?: string | null;
}> = ({
  detailsIndicateurTerritoire,
  mailleQuery,
  territoireCode,
  jalon,
  cartographieSelectionnee,
  aLaSelectionCartographie,
  listeCartographiesDesactives,
  unité,
}) => {
  const donneesEtLegendesCartographies: Record<
    CartographieIndicateurType,
    {
      useRecupererDonnees: () => {
        donneesCartographie: CartographieDonnées;
        legende: CartographieÉlémentDeLégende[];
        legendeDegrade: CartographieLégendeDégradéContenu | null;
      };
    }
  > = {
    avancementMandat: useCartographieAvancementIndicateur(
      detailsIndicateurTerritoire,
      ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
      jalon,
      "MANDAT",
    ),
    avancementJalon: useCartographieAvancementIndicateur(
      detailsIndicateurTerritoire,
      ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
      jalon,
      "JALON",
    ),
    propositionValeur: useCartographiePropositionValeurIndicateur(
      detailsIndicateurTerritoire,
      ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS,
    ),
    valeurAvancement: useCartographieValeurAvancementIndicateur(
      detailsIndicateurTerritoire,
      ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE,
      jalon,
      unité,
    ),
  };

  const pathname = "/chantier/[id]/[territoireCode]";
  const { auClicTerritoireMultiSélectionCallback } = useCartographie(
    territoireCode,
    pathname,
  );

  const optionsCartographie: SélecteurOption<CartographieIndicateurType>[] = [
    {
      valeur: "avancementMandat",
      libellé: "Carte des taux d'avancement 2026",
      désactivée: listeCartographiesDesactives.includes("avancementMandat"),
    },
    {
      valeur: "avancementJalon",
      libellé: `Carte des taux d'avancement ${jalon}`,
      désactivée: listeCartographiesDesactives.includes("avancementJalon"),
    },
    {
      valeur: "valeurAvancement",
      libellé: "Carte des valeurs d'avancement",
      désactivée: listeCartographiesDesactives.includes("valeurAvancement"),
    },
    {
      valeur: "propositionValeur",
      libellé: "Carte des propositions de valeur d'avancement",
      désactivée: listeCartographiesDesactives.includes("propositionValeur"),
    },
  ];

  const { legende, legendeDegrade, donneesCartographie } =
    donneesEtLegendesCartographies[
      cartographieSelectionnee
    ].useRecupererDonnees();

  return (
    <>
      <Sélecteur
        htmlName="selecteur-carte"
        options={optionsCartographie}
        valeurModifiéeCallback={aLaSelectionCartographie}
        valeurSélectionnée={cartographieSelectionnee}
      />
      <Cartographie
        auClicTerritoireCallback={auClicTerritoireMultiSélectionCallback}
        données={donneesCartographie}
        mailleSelectionnee={mailleQuery}
        options={{ multiséléction: true }}
        pathname={pathname}
        territoireCode={territoireCode}
      >
        {!!legendeDegrade ? (
          <CartographieLégendeDégradé contenu={legendeDegrade} />
        ) : null}
        <CartographieLégendeListe contenu={legende} />
      </Cartographie>
    </>
  );
};

export default CartographieAvecSelecteurIndicateur;
