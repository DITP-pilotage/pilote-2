import BulleDInfoStyled from './BulleDInfo.styled';
import BulleDInfoProps from './BulleDInfo.interface';

export default function BulleDInfo({ x, y, titre, contenu }: BulleDInfoProps) {
  return (
    <BulleDInfoStyled
      style={{
        top: y - 40, /* problème de performance avec styled component */
        left: x,
      }}
    >
      <div className='fr-py-1w fr-px-2w'>
        { titre }
      </div>
      <div className='fr-py-1w fr-px-2w fr-text--bold'>
        { contenu }
      </div>
    </BulleDInfoStyled>
  );
}
