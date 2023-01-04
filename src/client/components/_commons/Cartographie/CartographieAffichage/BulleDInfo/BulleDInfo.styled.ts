import styled from '@emotion/styled';

const BulleDInfoStyled = styled.div`
  position: fixed;
  font-size: 0.75rem;
  text-align: center;
  vertical-align: middle;
  background-color: var(--background-contrast-grey);
  box-shadow: 0 4px 4px 0 #00000040;
  transform: translate(-50%, -3rem);

  div:last-child {
    background-color: var(--background-alt-grey);
  }
`;

export default BulleDInfoStyled;
