import { useState } from 'react';
import PageAdminUtilisateursProps from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs.interface';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';

export default function PageAdminUtilisateurs({ utilisateurs } :PageAdminUtilisateursProps ) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        Filtres
      </BarreLatérale>
      <main>
        <div className='fr-mt-4w fr-mx-4w fr-mb-3w'>
          <Titre
            baliseHtml="h1"
            className="fr-h1"
          >
            Gestion des profils
          </Titre>
          <Bloc>
            <TableauAdminUtilisateurs utilisateurs={utilisateurs} />
          </Bloc>
        </div>
      </main>
    </div>
  );
}
