import styled from '@emotion/styled';

interface IcônesMultiplesEtTexteStyledProps {
  largeurDesIcônes: `${number}rem`;
}

const IcônesMultiplesEtTexteStyled = styled.div<IcônesMultiplesEtTexteStyledProps>`
  display: grid;
  grid-template-columns: ${(props) => props.largeurDesIcônes} auto;
  align-items: center;

  
  .icônes {
    display: flex;
    flex-flow: column wrap;
    align-content: center;
    max-height: 3rem;
  }
`;

export default IcônesMultiplesEtTexteStyled;
