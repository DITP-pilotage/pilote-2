import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieProps from '@/components/_commons/Cartographie/Cartographie.interface';

interface NextPageCartoProps {
  répartitionAvancementRégions: CartographieProps['données']
}

export default function NextPageCarto({ répartitionAvancementRégions }: NextPageCartoProps) {
  return (
    <div className='fr-container fr-my-3w'>
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col'>
          <Cartographie données={répartitionAvancementRégions} />
        </div>
        <div className='fr-col'>
          <Cartographie
            afficherFrance
            données={répartitionAvancementRégions}
          />
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const répartitionAvancementRégions: CartographieProps['données'] = [
    {
      codeInsee: '84',
      valeur: 45,
    },
    {
      codeInsee: '93',
      valeur: 22,
    },
  ];

  return {
    props: {
      répartitionAvancementRégions,
    },
  };
}
