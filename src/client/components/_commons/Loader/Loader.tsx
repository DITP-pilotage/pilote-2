import Image from 'next/image';
import LoaderStyled from './Loader.styled';
import marianneSvg from '/public/img/marianne.svg';

export default function Loader() {
  return (
    <LoaderStyled className='fr-grid-row fr-grid-row--center fr-grid-row--middle fr-py-2w'>
      <div className='fr-col-12'>
        <Image
          alt=''
          src={marianneSvg}
        />
        <p className='fr-mb-0'>
          Chargement des données en cours...
        </p>
      </div>
    </LoaderStyled>
  );
}
