import BoutonSousLignéInterface from '@/components/_commons/BoutonSousLigné/BoutonSousLigné.interface';
import BoutonSousLignéStyled from '@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled';

export default function BoutonSousLigné({ idHtml, children }: BoutonSousLignéInterface) {
  return (
    <BoutonSousLignéStyled
      aria-controls={idHtml}
      className="fr-link fr-mt-1w override"
      data-fr-opened="false"
      type="button"
    >
      { children }
    </BoutonSousLignéStyled>
  );
}
