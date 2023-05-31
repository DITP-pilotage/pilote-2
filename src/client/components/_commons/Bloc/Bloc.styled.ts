import styled from '@emotion/styled';

const BlocStyled = styled.div`
  height: 100%;
  background: white;
  border: 1px solid var(--border-disabled-grey);
  border-radius: 8px;

  .titre {
    background: var(--background-action-low-blue-france);
    border-bottom: 2px solid var(--border-plain-grey);
  }
  
  @media print {
    height: unset;
    
    .titre {
      break-after: avoid;
    }
  }
`;

export default BlocStyled;
