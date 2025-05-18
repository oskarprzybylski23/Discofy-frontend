'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ButtonWithTooltip } from '../button/buttonWithTooltip';

interface UserDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  hideCloseButton?: boolean;
}

export function UserDialog({
  open,
  setOpen,
  title,
  description,
  children,
  hideCloseButton = false,
}: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-dvh max-w-md md:h-dvh md:max-w-2xl lg:max-h-[600px] lg:max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-spotify-green text-xl'>
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className='text-font-mid text-base'>
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className='sr-only'> </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className='flex flex-col items-center space-y-4 mt-4 overflow-auto'>
            {children}
          </div>
        )}

        {!hideCloseButton && (
          <DialogFooter className='flex justify-end'>
            <ButtonWithTooltip
              variant={'outline'}
              onClick={() => setOpen(false)}
            >
              Close
            </ButtonWithTooltip>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
