import Titre from '@/components/_commons/Titre/Titre';
import PageChantiersProps from './PageChantiers.interface';
import styles from './PageChantiers.module.scss';
import RépartitionGéographique from './RépartitionGéographique';
import TauxAvancementMoyen from './TauxAvancementMoyen';
import RépartitionTauxAvancement from './RépartitionTauxAvancement';
import RépartitionDesMétéos from './RépartitionDesMétéos';
import FiltresChantiers from '@/components/Chantier/FiltresChantiers/FiltresChantiers';
import ListeChantiers from '@/components/Chantier/ListeChantiers/ListeChantiers';
import { useMemo, useState } from 'react';
import { filtresActifs as filtresActifsStore } from '@/client/stores/useFiltresStore/useFiltresStore';

export default function PageChantiers({ chantiers, périmètresMinistériels }: PageChantiersProps) {
  const [estOuverteBarreFiltres, setEstOuverteBarreFiltres] = useState(false);

  const filtresActifs = filtresActifsStore();

  const chantiersFiltrés = useMemo(() => (
    filtresActifs.périmètresMinistériels.length === 0
      ? chantiers
      : chantiers.filter(chantier => (filtresActifs.périmètresMinistériels.includes(chantier.id_périmètre)))
  ), [chantiers, filtresActifs]);
  
  return (
    <div className="flex">
      <FiltresChantiers
        estOuvert={estOuverteBarreFiltres}
        périmètresMinistériels={périmètresMinistériels}
        setEstOuvert={setEstOuverteBarreFiltres}
      />
      <div className={styles.contenuPrincipal}>
        <div className='fr-container fr-mt-4w'>
          <button
            className="fr-sr-only-lg fr-btn fr-btn--secondary fr-mb-2w"
            onClick={() => setEstOuverteBarreFiltres(true)}
            title="Ouvrir les filtres"
            type="button"
          >
            Filtres
          </button>
          <div className={styles.bloc}>
            <Titre
              apparence='fr-h4'
              baliseHtml='h1'
            > 
              62 chantiers dans les résultats
            </Titre>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className=' fr-col-12 fr-col-lg-6'>
                <RépartitionGéographique />
              </div>
              <div className={styles.conteneur + ' fr-col-12 fr-col-lg-6'}>
                <TauxAvancementMoyen />
                <div className="fr-grid-row fr-p-1w">
                  <RépartitionTauxAvancement />
                </div>
                <div className="fr-grid-row fr-p-1w">
                  <RépartitionDesMétéos />
                </div>
              </div>
            </div>
          </div>
          <div className="fr-grid-row fr-mt-3w">
            <div className="fr-col">
              <ListeChantiers chantiers={chantiersFiltrés} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
