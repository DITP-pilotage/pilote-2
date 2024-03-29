import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';

export default function MentionsLegales() {
  return (
    <main>
      <div className='fr-container fr-pb-2w'>
        <div className='fr-grid-row fr-py-4w'>
          <Titre
            baliseHtml='h1'
            className='fr-my-auto'
          >
            Mentions légales
          </Titre>
        </div>
        <Bloc>
          <div className='fr-grid-row'>
            <div className='fr-col-12'>
              <h4 className='fr-h4'>
                Éditeur
              </h4>
              <p>
                Ce site est édité par la Direction Interministérielle de la Transformation Publique.
              </p>
              <ul className='list-style-none fr-p-0'>
                <li>
                  20 avenue de Ségur
                </li>
                <li>
                  75334 Paris Cedex 07
                </li>
                <li>
                  France
                </li>
              </ul>
              <p>
                https://www.modernisation.gouv.fr
              </p>
            </div>
          </div>
          <div className='fr-grid-row'>
            <div className='fr-col-12'>
              <h4 className='fr-h4'>
                Direction de la publication
              </h4>
              <p>
                Ce site est édité par la Direction Interministérielle de la Transformation Publique.
              </p>
            </div>
          </div>
          <div className='fr-grid-row'>
            <div className='fr-col-12'>
              <h4 className='fr-h4'>
                Responsable éditoriale
              </h4>
              <p>
                Cécile Le Guen
              </p>
            </div>
          </div>
          <div className='fr-grid-row'>
            <div className='fr-col-12'>
              <h4 className='fr-h4'>
                Hébergement
              </h4>
              <ul className='list-style-none fr-p-0'>
                <li>
                  Scalingo SAS
                </li>
                <li>
                  3 place de Haguenau
                </li>
                <li>
                  67000 Strasbourg
                </li>
                <li>
                  France
                </li>
              </ul>
              <p>
                SIRET 80866548300018
              </p>
              <p>
                https://scalingo.com/fr
              </p>
            </div>
          </div>
        </Bloc>
      </div>
    </main>
  );
}
