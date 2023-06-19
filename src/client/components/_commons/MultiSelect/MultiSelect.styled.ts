import styled from '@emotion/styled';

const MultiSelectStyled = styled.div`
  .multiselect-menu {
    z-index: 2;
    
    input[type='checkbox']{
      margin-right: 0.5rem;
    }
  }
  
  .multiselect-value-container {
    display: initial;
    padding: .5rem 2.5rem .5rem 1rem;
  }
  
  .multiselect-control{
    border: 0;
  }
`;

export default MultiSelectStyled;
