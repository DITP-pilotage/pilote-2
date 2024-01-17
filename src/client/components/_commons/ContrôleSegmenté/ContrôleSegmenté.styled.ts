import styled from '@emotion/styled';

const ContrôleSegmentéStyled = styled.div`
  .fr-segmented__elements {
    width: 40rem;

    @media (max-width: 576px) {
      width: 12rem;
    }
  }

  .fr-segmented__element {
    width: 50%;
  }

  .fr-label-centered {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export default ContrôleSegmentéStyled;
