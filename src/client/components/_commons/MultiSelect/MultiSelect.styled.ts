import styled from '@emotion/styled';

const MultiSelectStyled = styled.div`
  
  position: relative;
  
  div[role='menu'] {
    display: none;
  }

  div[role='menu'].visible {
    position: absolute;
    z-index: 2;
    display: block;
    width: 100%;
    max-height: 20rem;
    padding: 1rem;
    overflow: auto;
    background: white;
    border: 1px solid grey;
  }
`;

export default MultiSelectStyled;
