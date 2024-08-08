import { FunctionComponent } from 'react';
import BulleDInfoStyled from './BulleDInfo.styled';

interface BulleDInfoProps {
  x: number,
  y: number,
  titre: string,
  contenu: string,
}

const BulleDInfo: FunctionComponent<BulleDInfoProps> = ({ x, y, titre, contenu }) => {
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
};

export default BulleDInfo;
