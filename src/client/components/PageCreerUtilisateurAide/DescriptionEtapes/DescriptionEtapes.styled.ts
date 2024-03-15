import styled from '@emotion/styled';

const DescriptionEtapesStyled = styled.div` 
  .c-stepper {
    display: flex;
  }
  
  .c-stepper__item {
    display: flex;
    flex: 1;
    flex-direction: column;
    text-align: center;
  
    &::before {
      display: block;
      width: 2.5rem;
      height: 2.5rem;
      padding-top: 0.5rem;
      margin: 0 auto 1rem;
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      content: attr(data-step);
      background-color: var(--background-action-high-blue-france);
      border-radius: 50%;
    }
  
    &:not(:last-child) {
      &::after {
        position: relative;
        top: 1.25rem;
        left: calc(50% + 1.5rem);
        order: -1;
        width: calc(100% - 3rem);
        height: 0;
        color: var(--background-action-high-blue-france);
        content: "";
        border: 4px dashed;
        border-top: 0;
      }
    }
  }

`;

export default DescriptionEtapesStyled;
