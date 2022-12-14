import { useMemo, useState } from 'react';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import { filtresActifs as filtresActifsStore } from '@/client/stores/useFiltresStore/useFiltresStore';
import Titre from '@/components/_commons/Titre/Titre';
import PageChantiersProps from './PageChantiers.interface';
import styles from './PageChantiers.module.scss';
import RépartitionGéographique from './RépartitionGéographique/RépartitionGéographique';
import TauxAvancementMoyen from './TauxAvancementMoyen/TauxAvancementMoyen';
import RépartitionTauxAvancement from './RépartitionTauxAvancement/RépartitionTauxAvancement';
import RépartitionMétéo from './RépartitionMétéo/RépartitionMétéo';
import FiltresChantiers from './FiltresChantiers/FiltresChantiers';
import ListeChantiers from './ListeChantiers/ListeChantiers';
import FiltresActifs from './FiltresActifs/FiltresActifs';

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
      <div className={`${styles.contenuPrincipal}`}>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreFiltres(true)}
          title="Ouvrir les filtres"
          type="button"
        >
          Filtres
        </button>
        <div>
          <FiltresActifs />
          <div className="fr-p-4w">
            <Titre
              apparence='fr-h4'
              baliseHtml='h1'
            >
              {`${chantiersFiltrés.length} chantiers`}
            </Titre>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-lg-6">
                <CarteSquelette>
                  <RépartitionGéographique />
                </CarteSquelette>
              </div>
              <div className="fr-col-12 fr-col-lg-6">
                <CarteSquelette>
                  <TauxAvancementMoyen />
                  <hr className='fr-hr fr-my-3w fr-pb-1v' />
                  <RépartitionMétéo />
                </CarteSquelette>
              </div>
            </div>
            <div className="fr-grid-row fr-my-3w">
              <div className="fr-col">
                <CarteSquelette>
                  <RépartitionTauxAvancement />
                </CarteSquelette>
              </div>
            </div>
          </div>
          <div className="fr-grid-row">
            <div className="fr-col">
              <CarteSquelette>
                <ListeChantiers chantiers={chantiersFiltrés} />
              </CarteSquelette>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
