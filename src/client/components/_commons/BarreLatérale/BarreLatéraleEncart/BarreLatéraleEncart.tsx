import BarreLatéraleEncartProps
  from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart.interface';
import BarreLatéraleEncartStyled from './BarreLatéraleEncart.styled';

export default function BarreLatéraleEncart({ children }: BarreLatéraleEncartProps) {
  return (
    <BarreLatéraleEncartStyled>
      <div className='fr-p-3w'>
        { children }
      </div>
    </BarreLatéraleEncartStyled>
  );
}
