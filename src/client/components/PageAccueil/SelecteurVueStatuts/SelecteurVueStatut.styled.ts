import styled from '@emotion/styled';

const SelecteurVueStatutStyled = styled.div`
  display: flex;

  .fr-tag-active {
    color: white;
    background-color: var(--blue-france-sun-113-625);
  }
  
  .fr-tag-active:hover {
    color: white;
    cursor: not-allowed;
    background-color: var(--blue-france-sun-113-625);
  }

  .separator {
    height: 100%;
    border-left: 2px solid var(--blue-france-sun-113-625);
  }
`;

export default SelecteurVueStatutStyled;
