import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';

import { useState } from 'react';
import InputAvecLabel from '@/components/_commons/ReactHookForm/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import PageUtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import useUtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UseUtilisateurFormulaire';
export default function UtilisateurFormulaire({ chantiers, périmètresMinistériels, profils } :PageUtilisateurFormulaireProps) {

  const { listeProfils, register, handleSubmit, erreurs, créerUtilisateur } = useUtilisateurFormulaire(profils);
  const texteAideProfil = 'Les droits attribués dépendent du profil sélectionné. Vous pouvez consulter la correspondance entre profils et droits ci-dessus.\n';

  const [profilSélectionné, setProfilSélectionné] = useState('');

  return (
    <form onSubmit={handleSubmit(créerUtilisateur)}>
      <InputAvecLabel
        erreur={erreurs.email}
        libellé="Adresse électronique"
        name="email"
        register={register}
        texteAide="Format attendu : nom@domaine.fr"
        type='email'
      />
      <InputAvecLabel
        erreur={erreurs.nom}
        libellé="Nom"
        name="nom"
        register={register}
      />
      <InputAvecLabel
        erreur={erreurs.prénom}
        libellé="Prénom"
        name="prénom"
        register={register}
      />
      <InputAvecLabel
        erreur={erreurs.fonction}
        libellé="Fonction"
        name="fonction"
        register={register}
      />
      <Sélecteur
        erreur={erreurs.profil}
        htmlName='profil'
        libellé='Profil'
        options={listeProfils}
        register={register('profil')}
        texteAide={texteAideProfil}
        texteFantôme='Sélectionnez une option'
        valeurModifiéeCallback={p => setProfilSélectionné(p)}
        valeurSélectionnée={profilSélectionné}
      />
      <input
        className='fr-btn'
        type="submit"
        value='Suivant'
      />
    </form>
  );
}
