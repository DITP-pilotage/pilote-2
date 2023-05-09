import styled from '@emotion/styled';

const BoutonSousLignéStyled = styled.button`
  &.override {
    height: 1.5rem;
    border-bottom: 1px solid;

    :hover {
      background-color: unset;
      border-bottom-width: 2px;
    }
  }
`;

export default BoutonSousLignéStyled;
