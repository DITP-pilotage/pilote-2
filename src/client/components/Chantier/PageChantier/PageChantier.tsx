import Titre from '@/components/_commons/Titre/Titre';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import styles from './PageChantier.module.scss';
import Responsables from './Responsables/Responsables';
import Sommaire from './Sommaire/Sommaire';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';

const listeIndicateurs = [
  { nom: 'Indicateurs de contexte', ancre: '#contexte' },
  { nom: 'Indicateurs de déploiement', ancre: '#déploiement' },
  { nom: 'Indicateurs d\'impact', ancre: '#impact' },
  { nom: 'Indicateurs de perception et de qualité de service', ancre: '#perception' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: '#suivi' },
];

const listeÉlémentsPage = [
  { nom: 'Avancement', ancre: '#avancement' },
  { nom: 'Synthèse des résultats', ancre: '#synthèse' },
  { nom: 'Indicateurs', ancre: '#indicateurs', sousÉlément: listeIndicateurs },
  { nom: 'Commentaires', ancre: '#commentaires' },
  { nom: 'Responsables', ancre: '#responsables' },
];

export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <div className={styles.conteneur}>
      <header className={`${styles.header} fr-px-15w fr-py-4w`}>
        <Titre baliseHtml='h1'>
          {chantier.nom}
        </Titre>
      </header>
      <div className='flex'>
        <Sommaire éléments={listeÉlémentsPage} />
        <div className={`${styles.contenuPrincipal} fr-pt-4w fr-pr-3w`}>
          <AvancementChantier chantier={chantier} />
          <SynthèseRésultats />
          <Indicateurs />
          <Commentaires />
          <Responsables />
        </div>
      </div>
    </div>
  );
}
