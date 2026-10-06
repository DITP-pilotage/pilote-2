import { FunctionComponent } from "react";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { CartographieÉlémentDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";

export const ReadOnlyCartographie: FunctionComponent<{
  donnees: CartographieDonnées;
  legende: CartographieÉlémentDeLégende[];
  maille: MailleInterne;
  territoireCode?: string;
}> = ({ donnees, legende, maille, territoireCode }) => {
  const donneesV2: Record<string, CartographieV2Donnee> = Object.fromEntries(
    Object.entries(donnees).map(([code, donnee]) => [
      code,
      {
        remplissage: donnee.remplissage,
        libelle: donnee.libellé,
        contenuInfoBulle: donnee.contenu,
      },
    ]),
  );

  return (
    <div className="mx-auto max-w-[25rem]">
      <CartographieV2
        donnees={donneesV2}
        maille={maille}
        territoiresSelectionnes={
          territoireCode && territoireCode !== "NAT-FR" ? [territoireCode] : []
        }
      >
        <LegendeCartographie items={legende} />
      </CartographieV2>
    </div>
  );
};
