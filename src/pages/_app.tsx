/* eslint-disable react/jsx-props-no-spreading */
import '@gouvfr/dsfr/dist/core/core.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import Layout from 'client/components/_commons/Layout/Layout';
import ChantierStore from 'client/stores/useChantierStore/ChantierStore.interface';
import useChantierStore from 'client/stores/useChantierStore/useChantierStore';

import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useEffect } from 'react';

//Temporaire en attendant les vrais données du back
import { chantiers as donnéesChantiers } from '../client/components/Chantier/FakeChantiers/FakeChantiers'; 

let chantiers: ChantierStore[] = [];

interface MonApplicationProps extends AppProps {
  donnéesInitiales: {
    chantiers: ChantierStore[]
  }
}

function MonApplication({ Component, pageProps, donnéesInitiales }: MonApplicationProps) {
  const setChantiers = useChantierStore(state => state.setChantiers);

  useEffect(() => {  
    setChantiers(donnéesInitiales.chantiers);
  }, [donnéesInitiales, setChantiers]);

  return (
    <>
      <Script
        src="js/dsfr/dsfr.module.min.js"
        type='module'
      />
      <Script
        noModule
        src="js/dsfr/dsfr.nomodule.min.js"
      />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

function getChantiers(): ChantierStore[] {
  return donnéesChantiers.map(chantier => ({
    id: chantier.id, 
    axe: chantier.axe, 
    nom: chantier.nom,
    ministere: chantier.ministere,
    ppg: chantier.ppg,
  }));
}

MonApplication.getInitialProps = async () => {
  if (chantiers.length === 0) {
    chantiers = getChantiers();
  }
  return { donnéesInitiales: { chantiers } };
};

export default MonApplication;