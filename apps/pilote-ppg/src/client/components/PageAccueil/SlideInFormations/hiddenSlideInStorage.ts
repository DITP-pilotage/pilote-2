import { z } from "zod";

const CLE = "formations:slide-in-masquee";

const slideInMasqueeSchema = z.object({
  utilisateurId: z.uuid(),
  periodeId: z.uuid(),
});

type SlideInMasquee = z.infer<typeof slideInMasqueeSchema>;

// Le sessionStorage disparaît avec l'onglet : la slide-in masquée par la croix revient à la
// prochaine ouverture de PILOTE.
export const isSlideInHidden = ({
  utilisateurId,
  periodeId,
}: SlideInMasquee): boolean => {
  const brut = sessionStorage.getItem(CLE);
  if (!brut) return false;

  try {
    const result = slideInMasqueeSchema.safeParse(JSON.parse(brut));
    return (
      result.success &&
      result.data.utilisateurId === utilisateurId &&
      result.data.periodeId === periodeId
    );
  } catch {
    return false;
  }
};

export const writeHiddenSlideIn = (slideIn: SlideInMasquee): void => {
  sessionStorage.setItem(CLE, JSON.stringify(slideIn));
};
