import styled from '@emotion/styled';

const BlocStyled = styled.div`
  min-width: 100%;
  background: white;
  border: 1px solid var(--border-disabled-grey);
  border-radius: 8px; 

  .titre {
    background: var(--background-action-low-blue-france);
    border-bottom: 2px solid var(--border-plain-grey);
    border-radius: 7px 7px 0 0;
    height: 4rem;
  }
  
  .titre-ellipsis {
    width: auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  @media print {
    height: unset;
    border: 1px solid #7B7B7B;
    
    .titre {
      border-radius: 8px 8px 0 0;
    }
  }
`;

export default BlocStyled;
