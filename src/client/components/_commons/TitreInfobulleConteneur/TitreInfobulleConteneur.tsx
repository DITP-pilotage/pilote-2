import TitreInfobulleConteneurProps from './TitreInfobulleConteneur.interface';
import TitreInfobulleConteneurStyled from './TitreInfobulleConteneur.styled';

export default function TitreInfobulleConteneur({ className, children }: TitreInfobulleConteneurProps) {
  return (
    <TitreInfobulleConteneurStyled className={`${className} flex`}>
      {children}
    </TitreInfobulleConteneurStyled>
  );
}
