import PictoTerritorialiséstyled from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé.styled';

export default function PictoTerritorialisé() {
  return (
    <>
      <PictoTerritorialiséstyled
        className='fr-icon-map-pin-2-line'
      />
      <span className='fr-sr-only'>
        chantier territorialisé
      </span>
    </>
  );
}
