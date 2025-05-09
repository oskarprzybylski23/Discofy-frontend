import { cn } from '../../lib/utils';
import { Check, X } from 'lucide-react';
import { ButtonWithTooltip } from '../button/buttonWithTooltip';

type AlbumItemProps = {
  index: number;
  title: string;
  artist: string;
  coverUrl: string;
  url: string;
  highlight?: boolean;
  className?: string;
  toggleable?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
};

export default function AlbumItem({
  index,
  title,
  artist,
  coverUrl,
  url,
  highlight = false,
  className,
  toggleable = false,
  disabled = false,
  onToggle,
}: AlbumItemProps) {
  return (
    <li>
      <div
        className={cn(
          'bg-mid-background text-base flex items-center gap-2 mt-0.5 p-2 min-h-10 rounded-md hover:bg-highlight-dark',
          highlight && 'bg-failed hover:bg-failed-highlight',
          disabled && 'opacity-50',
          className
        )}
      >
        <span className='text-font-mid text-sm flex justify-center items-center w-8'>
          {index + 1}
        </span>
        <img className='h-10' src={coverUrl} alt='Album Cover' />
        <div className='flex flex-col w-[70%]'>
          <span className='overflow-y-hidden font-medium hover:underline w-fit'>
            <a href={url} target='blank'>
              {title}
            </a>
          </span>
          <span className='text-font-mid text-sm w-fit'>{artist}</span>
        </div>
        {toggleable && onToggle && (
          <ButtonWithTooltip
            variant={'ghost'}
            size={'icon'}
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            showTooltip={true}
            tooltip={disabled ? 'Include in playlist' : 'Exclude from playlist'}
            tooltipOffset={10}
            tooltipSide='bottom'
            className={cn(
              'transition-colors hover:bg-opacity-0',
              disabled ? 'hover:text-spotify-green' : 'hover:text-failed'
            )}
            aria-label={disabled ? 'Enable album' : 'Disable album'}
          >
            {disabled ? <Check size={18} /> : <X size={18} />}
          </ButtonWithTooltip>
        )}
      </div>
    </li>
  );
}
