import { FunctionComponent, ReactNode } from 'react';
import TitreInfobulleConteneurStyled from './TitreInfobulleConteneur.styled';

interface TitreInfobulleConteneurProps {
  className?: string;
  children: ReactNode;
}

const TitreInfobulleConteneur: FunctionComponent<TitreInfobulleConteneurProps> = ({ className, children }) => {
  return (
    <TitreInfobulleConteneurStyled className={`${className} flex`}>
      {children}
    </TitreInfobulleConteneurStyled>
  );
};

export default TitreInfobulleConteneur;
