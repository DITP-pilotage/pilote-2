import styled from '@emotion/styled';

const MultiSelectStyled = styled.div`
  
  position: relative;
  
  div[role='menu'] {
    display: none;
  }

  div[role='menu'].visible {
    display: block;
    position: absolute;
    width: 100%;
    max-height: 20rem;
    overflow: auto;
    z-index: 2;
    background: white;
    border: 1px solid grey;
    padding: 1rem;
  }
`;

export default MultiSelectStyled;
