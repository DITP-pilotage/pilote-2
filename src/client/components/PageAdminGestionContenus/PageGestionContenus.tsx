import { useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import Titre from '@/components/_commons/Titre/Titre';
import {
  BarreLateraleElement,
  BarreLateraleElements,
} from '@/components/_commons/BarreLateraleElements/BarreLateraleElements';

const gestionContenusMenuElements: BarreLateraleElement[] = [
  {
    libelle: 'Message d\'information',
    lien: '/admin/gestion-contenus',
  }, {
    libelle: 'Nouveautés',
    lien: '#',
  }, {
    libelle: 'Textes des infobulles',
    lien: '#',
  }, {
    libelle: 'Chantiers',
    lien: '#',
  }, {
    libelle: 'Indicateurs des chantiers',
    lien: '#',
  }, {
    libelle: 'Projets structurants',
    lien: '#',
  }, {
    libelle: 'Indicateurs des projets structurants',
    lien: '#',
  },
];
export function PageGestionContenus() {

  const [estOuvert, setEstOuvert] = useState<boolean>(false);
  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuvert}
        setEstOuvert={setEstOuvert}
      >
        <div className='fr-px-3w fr-py-2w fr-sidemenu'>
          <Titre
            baliseHtml='h2'
            className='fr-h4 fr-py-1w'
          >
            Rubriques modifiables
          </Titre>
          <BarreLateraleElements elements={gestionContenusMenuElements} />
        </div>
      </BarreLatérale>
      <main />
    </div>
  );

}
