import { PictoBaromètre } from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const BadgeIndicateurBarometre = () => {
  const { indicateur } = useBlocIndicateurContext();

  return indicateur.estIndicateurDuBaromètre ? (
    <span className="fr-mr-1v">
      <PictoBaromètre />
    </span>
  ) : null;
};
