import styled, {keyframes} from 'styled-components';

const fadeIn = keyframes`
  0% {
    opacity: 0;
    top: 1rem;
  }

  85% {
    opacity: 0;
    top: 1rem;
  }

  100% {
    opacity: 1;
    top: 0rem;
  }
`;

export const ErrorMessage = styled.div`
    position: relative;
    top: 0;
    padding-left: 1rem;
    animation: ${fadeIn} .7s ease-out forwards;
`;
