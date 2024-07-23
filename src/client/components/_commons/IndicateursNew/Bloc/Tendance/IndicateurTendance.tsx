import 'material-symbols/index.css';
import 'material-icons/iconfont/material-icons.css';

const IndicateurTendance = () => {
 
  return (
    <div className='flex flex-direction-row fr-ml-2w fr-mr-1w'>
      <p className='fr-text--xs fr-text-title--blue-france fr-mb-1w'>
        <span
          aria-hidden='true'
          className='material-icons-sharp'
        >
          trending_down
        </span>
      </p>
      <p className='fr-text--xs texte-gris fr-ml-1w fr-pt-1v fr-mb-1w'>
        Attention, cet indicateur a un objectif de baisse. La cible représente une valeur inférieure à la valeur initiale.           
      </p>
    </div>
  );
};

export default IndicateurTendance;
