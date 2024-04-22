import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { useSession } from 'next-auth/react';
import {
  actions as actionsFiltresUtilisateursStore,
  filtresUtilisateursActifsStore,
  réinitialiser,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Titre from '@/components/_commons/Titre/Titre';
import AdminUtilisateursBarreLatéraleProps from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale.interface';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import MultiSelectPérimètreMinistériel from '@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import Tag from '@/components/_commons/Tag/Tag';
import { territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import MultiSelectProfil from '@/components/_commons/MultiSelect/MultiSelectProfil/MultiSelectProfil';
import { AAccesATousLesUtilisateurs, PROFILS_POSSIBLES_REFERENTS_LECTURE } from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';

export default function AdminUtilisateursBarreLatérale({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}: AdminUtilisateursBarreLatéraleProps) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: périmètresMinistériels } = api.périmètreMinistériel.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: profils } = api.profil.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: session } = useSession();
  const { modifierÉtatDuFiltre, désactiverFiltre } = actionsFiltresUtilisateursStore();
  const territoires = territoiresTerritoiresStore();
  const filtresActifs = filtresUtilisateursActifsStore();
  const réinitialiserFiltres = réinitialiser();
  const territoiresAccessibles = session!.habilitations.lecture.territoires;
  const profilCréateur = profils?.find(profil => profil.code === session!.profil);
  const profilAccessibles = AAccesATousLesUtilisateurs(profilCréateur ?? null)
    ? (profils ?? []) : 
    profils?.filter(profil => PROFILS_POSSIBLES_REFERENTS_LECTURE[profilCréateur?.code as keyof typeof PROFILS_POSSIBLES_REFERENTS_LECTURE].includes(profil.code));

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className='fr-mb-2w'>
          <MultiSelectTerritoire
            changementValeursSélectionnéesCallback={(territoire) => {
              modifierÉtatDuFiltre(territoire, 'territoires');
            }}
            groupesÀAfficher={{
              nationale: territoiresAccessibles.includes('NAT-FR'),
              régionale: true,
              départementale: true,
            }}
            territoiresCodesSélectionnésParDéfaut={filtresActifs.territoires}
            territoiresSélectionnables={territoiresAccessibles}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(périmètreMinistériel) => {
              modifierÉtatDuFiltre(périmètreMinistériel, 'périmètresMinistériels', chantiers);
            }}
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtresActifs.périmètresMinistériels}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              modifierÉtatDuFiltre(chantier, 'chantiers');
            }}
            chantiers={chantiers ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
        </div>
        <MultiSelectProfil
          changementValeursSélectionnéesCallback={(profil) => {
            modifierÉtatDuFiltre(profil, 'profils');
          }}
          profils={profilAccessibles ?? []}
          profilsIdsSélectionnésParDéfaut={filtresActifs.profils}
        />
      </BarreLatéraleEncart>
      <div className='fr-px-3w fr-py-2w'>
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          Filtres actifs
        </Titre>
        <button
          className='fr-btn fr-btn--secondary'
          onClick={réinitialiserFiltres}
          type='button'
        >
          Réinitialiser les filtres
        </button>
        <button
          aria-controls='fr-sidemenu-item-territoires'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Territoires(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-territoires'
        >
          {
            filtresActifs.territoires.map(territoireCode => {
              const libellé = territoires.find(t => t.code === territoireCode)?.nomAffiché ?? null;
              return libellé === null ? null : (
                <Tag
                  key={territoireCode}
                  libellé={libellé}
                  suppressionCallback={() => {
                    désactiverFiltre(territoireCode, 'territoires');
                  }}
                />
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-périmètresMinistériels'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Périmètre(s) ministériel(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-périmètresMinistériels'
        >
          {
            filtresActifs.périmètresMinistériels.map(périmètreMinistérielId => {
              let libellé = périmètresMinistériels?.find(périmètre => périmètre.id === périmètreMinistérielId)?.nom ?? null;
              return libellé === null ? null : (
                <Tag
                  key={périmètreMinistérielId}
                  libellé={libellé}
                  suppressionCallback={() => {
                    désactiverFiltre(périmètreMinistérielId, 'périmètresMinistériels');
                  }}
                />
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-chantiers'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Chantier(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-chantiers'
        >
          {
            filtresActifs.chantiers.map(chantierId => {
              let libellé = chantiers?.find(c => c.id === chantierId)?.nom ?? null;
              return libellé === null ? null : (
                <Tag
                  key={chantierId}
                  libellé={libellé}
                  suppressionCallback={() => {
                    désactiverFiltre(chantierId, 'chantiers');
                  }}
                />
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-profils'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-m-0'
          type='button'
        >
          Profil(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-profils'
        >
          {
            filtresActifs.profils.map(profilCode => {
              let libellé = profils?.find(c => c.code === profilCode)?.nom ?? null;
              return libellé === null ? null : (
                <Tag
                  key={profilCode}
                  libellé={libellé}
                  suppressionCallback={() => {
                    désactiverFiltre(profilCode, 'profils');
                  }}
                />
              );
            })
          }
        </div>
      </div>
    </BarreLatérale>
  );
}
