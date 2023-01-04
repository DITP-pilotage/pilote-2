import BulleDInfoStyled from '@/components/_commons/Cartographie2/BulleDInfo.styled';
import BulleDInfoProps from '@/components/_commons/Cartographie2/BulleDInfo.interface';

export default function BulleDInfo({ x, y }: BulleDInfoProps) {

  return (
    <BulleDInfoStyled
      style={{
        top: y, /* problème de performance avec styled component */
        left: x,
      }}
    >
      bulle!
    </BulleDInfoStyled>
  );
}
