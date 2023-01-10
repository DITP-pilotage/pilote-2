import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';

export default function RépartitionGéographique() {
  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition géographique
      </Titre>
      <Cartographie
        maille='régionale'
        zone={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
    </>
  );
}
