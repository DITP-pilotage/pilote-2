import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const animationOpacité = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const LoaderStyled = styled.div`
  text-align: center;

  img {
    animation: ${animationOpacité} 2s ease-in-out infinite;
  }
`;

export default LoaderStyled;
