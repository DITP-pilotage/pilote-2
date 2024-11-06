import { FunctionComponent, ReactNode } from 'react';
import BulleDInfoStyled from './BulleDInfo.styled';

interface BulleDInfoProps {
  x: number,
  y: number,
  titre: string,
  children: ReactNode,
}

const BulleDInfo: FunctionComponent<BulleDInfoProps> = ({ x, y, titre, children }) => {
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
      <div className='fr-py-1w fr-px-2w'>
        { children }
      </div>
    </BulleDInfoStyled>
  );
};

export default BulleDInfo;
