import { Bike } from 'lucide-react';
import { Styled } from './StationIcon.styles';

export interface StationIconProps {
  /** Size of the icon container in pixels */
  size?: number;

  /** Icon variant for different states */
  variant?: 'default' | 'hover' | 'active';

  /** Optional CSS class name */
  className?: string;

  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Station icon component with bike icon inside a circle
 *
 * Renders a circular background with a Lucide bike icon.
 * Used in map markers and UI components.
 *
 * @example
 * ```tsx
 * <StationIcon size={32} variant="default" />
 * <StationIcon size={48} variant="hover" />
 * ```
 */
export const StationIcon = ({
  size = 32,
  variant = 'default',
  className,
  onClick,
}: StationIconProps) => {
  const iconSize = size * 0.55; // Icon is 55% of container size

  return (
    <Styled.Container
      size={size}
      variant={variant}
      className={className}
      onClick={onClick}
      role="img"
      aria-label="Station marker"
    >
      <Bike size={iconSize} strokeWidth={2.5} />
    </Styled.Container>
  );
};
