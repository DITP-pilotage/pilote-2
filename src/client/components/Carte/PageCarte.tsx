import { useCallback, useEffect, useState } from 'react';

function aléa() {
  return Math.floor(Math.random() * 100);
}

export default function PageCarte() {

  const [données, setDonnées] = useState<any>();

  const générerDonnées = useCallback(() => ({
    '01': aléa(), '02': aléa(), '03': aléa(), '04': aléa(), '05': aléa(), '06': aléa(), '07': aléa(), '08': aléa(), '09': aléa(), '10': aléa(), '11': aléa(),
    '12': aléa(), '13': aléa(), '14': aléa(), '15': aléa(), '16': aléa(), '17': aléa(), '18': aléa(), '19': aléa(), '21': aléa(), '22': aléa(), '23': aléa(),
    '24': aléa(), '25': aléa(), '26': aléa(), '27': aléa(), '28': aléa(), '29': aléa(), '30': aléa(), '31': aléa(), '32': aléa(), '33': aléa(), '34': aléa(),
    '35': aléa(), '36': aléa(), '37': aléa(), '38': aléa(), '39': aléa(), '40': aléa(), '41': aléa(), '42': aléa(), '43': aléa(), '44': aléa(), '45': aléa(),
    '46': aléa(), '47': aléa(), '48': aléa(), '49': aléa(), '50': aléa(), '51': aléa(), '52': aléa(), '53': aléa(), '54': aléa(), '55': aléa(), '56': aléa(),
    '57': aléa(), '58': aléa(), '59': aléa(), '60': aléa(), '61': aléa(), '62': aléa(), '63': aléa(), '64': aléa(), '65': aléa(), '66': aléa(), '67': aléa(),
    '68': aléa(), '69': aléa(), '70': aléa(), '71': aléa(), '72': aléa(), '73': aléa(), '74': aléa(), '75': aléa(), '76': aléa(), '77': aléa(), '78': aléa(),
    '79': aléa(), '80': aléa(), '81': aléa(), '82': aléa(), '83': aléa(), '84': aléa(), '85': aléa(), '86': aléa(), '87': aléa(), '88': aléa(), '89': aléa(),
    '90': aléa(), '91': aléa(), '92': aléa(), '93': aléa(), '94': aléa(), '95': aléa(), '971': aléa(), '972': aléa(), '973': aléa(), '974': aléa(), '976': aléa(),
    '2A': aléa(), '2B': aléa(),
  }), []);


  useEffect(() => {
    setDonnées(générerDonnées());
  }, [setDonnées, générerDonnées]);

  return (
    <>
      <button
        onClick={() => setDonnées(générerDonnées())}
        type="button"
      >
        Générer de nouvelles valeurs
      </button>
      { JSON.stringify(données) }
      { // @ts-ignore
        <map-chart
          data={JSON.stringify(données)}
          name="Nom de l'indicateur"
          valuenat={10}
        />
      }
    </>
  );
}
