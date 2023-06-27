import styled from '@emotion/styled';

const CartesStyled = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 48rem) {;
    grid-template-columns: 1fr 1fr;
  }
  
  @media print {
    grid-template-columns: 1fr 1fr;
  }
`;

export default CartesStyled;
