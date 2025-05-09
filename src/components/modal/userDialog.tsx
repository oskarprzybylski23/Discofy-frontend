'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
      <DialogContent className='max-w-md md:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-spotify-green text-xl'>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className='text-font-mid text-base'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className='flex flex-col items-center space-y-4 mt-4'>
            {children}
          </div>
        )}

        {!hideCloseButton && (
          <DialogFooter className='flex justify-end'>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
