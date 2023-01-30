import styled from '@emotion/styled';

const CartographieLégendeStyled = styled.ul`
  display: flex;
  flex-wrap: wrap;
  max-width: 28rem;
  padding: 0;
  margin: 0;
  list-style-type: none;

  > li {
    display: flex;
    align-items: center;
    padding: 0;

    > img {
      height: 1.2rem;
    }
  }
`;

export default CartographieLégendeStyled;
