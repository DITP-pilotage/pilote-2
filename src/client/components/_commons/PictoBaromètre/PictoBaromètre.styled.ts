import styled from '@emotion/styled';
import { PictoBaromètreStyledProps } from '@/components/_commons/PictoBaromètre/PictoBaromètre.interface';



const PictoBaromètreStyled = styled.span<PictoBaromètreStyledProps>`
  color: var(--text-mention-gre);

  &::before {
    width: ${props => props.taille.mesure + props.taille.unité};
    height: ${props => props.taille.mesure + props.taille.unité};
    mask-size: contain;
  }
`;

export default PictoBaromètreStyled;
