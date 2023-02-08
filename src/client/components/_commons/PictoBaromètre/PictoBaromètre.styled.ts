import styled from '@emotion/styled';
import { Taille } from '@/components/_commons/PictoBaromètre/PictoBaromètre.interface';

interface PictoBaromètreStyledProps {
  taille: Taille,
}

const PictoBaromètreStyled = styled.span<PictoBaromètreStyledProps>`
  &::before {
    width: ${props => props.taille.mesure + props.taille.unité};
    height: ${props => props.taille.mesure + props.taille.unité};
    mask-size: contain;
  }
`;

export default PictoBaromètreStyled;
