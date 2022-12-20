import '@gouvfr/dsfr/dist/dsfr.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import 'dsfr-chart/Charts/dsfr-chart.css';
import Script from 'next/script';
import PageCarte from '@/components/Carte/PageCarte';

export default function NextPageCarte() {
  return (
    <>
      <Script src="js/dsfr-chart/dsfr-chart.umd.min.js" />
      <PageCarte />
    </>
  );
}
