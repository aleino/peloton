import { ReactNode } from 'react';
import { Styled } from './MapControls.styles';

interface ControlButtonProps {
  icon: ReactNode;
  isOpen: boolean;
  onClick: () => void;
  ariaLabel: string;
}

export const ControlButton = ({ icon, isOpen, onClick, ariaLabel }: ControlButtonProps) => {
  return (
    <Styled.ControlButton
      isOpen={isOpen}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {icon}
    </Styled.ControlButton>
  );
};
