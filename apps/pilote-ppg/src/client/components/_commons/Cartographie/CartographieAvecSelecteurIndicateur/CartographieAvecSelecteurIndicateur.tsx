import { FunctionComponent } from "react";
import {
  SelectField,
  type SelectFieldOption,
} from "@/components/shared/SelectField";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
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

export const CartographieAvecSelecteurIndicateur: FunctionComponent<{
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
    avancementJalon: useCartographieAvancementIndicateur(
      detailsIndicateurTerritoire,
      ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
      jalon,
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

  const optionsCartographie: SelectFieldOption<CartographieIndicateurType>[] = [
    {
      valeur: "avancementJalon",
      libelle: `Carte des taux d'avancement ${jalon}`,
      desactivee: listeCartographiesDesactives.includes("avancementJalon"),
    },
    {
      valeur: "valeurAvancement",
      libelle: "Carte des valeurs d'avancement",
      desactivee: listeCartographiesDesactives.includes("valeurAvancement"),
    },
    {
      valeur: "propositionValeur",
      libelle: "Carte des propositions de valeur d'avancement",
      desactivee: listeCartographiesDesactives.includes("propositionValeur"),
    },
  ];

  const { legende, legendeDegrade, donneesCartographie } =
    donneesEtLegendesCartographies[
      cartographieSelectionnee
    ].useRecupererDonnees();

  const { listeTerritoires } = useTerritoireHabilitation();
  const [territoiresCompares] = useTerritoiresCompares();

  const donneesV2: Record<string, CartographieV2Donnee> = Object.fromEntries(
    Object.entries(donneesCartographie).map(([code, donnee]) => [
      code,
      {
        remplissage: donnee.remplissage,
        libelle: donnee.libellé,
        contenuInfoBulle: donnee.contenu,
      },
    ]),
  );
  const territoiresSelectionnables = listeTerritoires
    .filter(
      (territoire) =>
        territoire.accèsLecture &&
        donneesCartographie[territoire.code]?.estApplicable,
    )
    .map((territoire) => territoire.code);
  const territoiresSelectionnes = [
    territoireCode,
    ...territoiresCompares.split(",").filter(Boolean),
  ].filter((code) => code !== "NAT-FR");

  return (
    <>
      <SelectField
        name="selecteur-carte"
        onChange={aLaSelectionCartographie}
        options={optionsCartographie}
        value={cartographieSelectionnee}
      />
      <CartographieV2
        donnees={donneesV2}
        maille={mailleQuery}
        onTerritoireSelect={(code) =>
          auClicTerritoireMultiSélectionCallback(code, true)
        }
        territoiresSelectionnables={territoiresSelectionnables}
        territoiresSelectionnes={territoiresSelectionnes}
      >
        {legendeDegrade ? (
          <CartographieLégendeDégradé contenu={legendeDegrade} />
        ) : null}
        <LegendeCartographie items={legende} />
      </CartographieV2>
    </>
  );
};
