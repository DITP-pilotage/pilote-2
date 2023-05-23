import Icône from '@/components/_commons/Icône/Icône';
import IcônesMultiplesEtTexteStyled from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte.styled';
import IcônesMultiplesEtTexteProps from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte.interface';

export default function IcônesMultiplesEtTexte({ icônesId, children }: IcônesMultiplesEtTexteProps) {
  return (
    <IcônesMultiplesEtTexteStyled>
      <span className="icônes fr-pr-1w">
        {
          icônesId.map(icôneId => (
            <Icône
              id={icôneId}
              key={icôneId}
            />
          ))
        }
      </span>
      { children }
    </IcônesMultiplesEtTexteStyled>
  );
}
