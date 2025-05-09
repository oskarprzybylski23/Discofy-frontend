import React from 'react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ButtonWithTooltip extends React.ComponentProps<typeof Button> {
  tooltip?: string;
  showTooltip?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tooltipOffset?: number;
}

export const ButtonWithTooltip: React.FC<ButtonWithTooltip> = ({
  tooltip,
  showTooltip = false,
  tooltipSide = 'top',
  tooltipOffset = 0,
  children,
  ...buttonProps
}) => {
  const button = (
    <Button className='font-bold' {...buttonProps}>
      {children}
    </Button>
  );

  if (showTooltip && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side={tooltipSide}
            sideOffset={tooltipOffset}
            className='bg-mid-background'
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
