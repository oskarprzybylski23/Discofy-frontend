import { SiGithub } from 'react-icons/si';
import { UserDialog } from '../modal/userDialog';
import { useState } from 'react';
import { ButtonWithTooltip } from '../button/buttonWithTooltip';

export default function Footer() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const aboutDialogTitle = 'About Discofy';
  const aboutDialogContent = (
    <>
      <p>
        <strong>Discofy</strong> is a tool that connects your Discogs collection
        to Spotify, making it easy to create a playlist from your records.
      </p>
      <p>
        You can <strong>browse your Discogs library</strong> and when you{' '}
        <strong>export</strong> we will try to find best matches for your
        records in the Spotify catalogue. You can then{' '}
        <strong>save it as a playlist</strong>.
      </p>
      <hr className='mb-3 border-t border-1/8 w-full border-spotify-green' />
      <p>
        We use cookies <strong>only for session management</strong> — to keep
        you logged in while using the app. No tracking and no third-party
        cookies. We do not store any personal or account information and all
        session data is removed as soon as you disconnect.
      </p>
      <hr className='mb-3 border-t border-1/8 w-full border-spotify-green' />
      <p>
        <strong>Discofy</strong> is a project created by{' '}
        <a href='https://github.com/oskarprzybylski23'>
          <strong>Oskar Przybylski</strong>
        </a>{' '}
        . If you encounter any bugs or have an idea for a new feature we want to
        hear from you.
      </p>
      <p>
        <a
          href='https://github.com/oskarprzybylski23/discofy'
          target='_blank'
          className='hover:underline'
        >
          <strong>Visit GitHub</strong>
        </a>
      </p>
    </>
  );

  const handleAboutDialogOpen = () => {
    setDialogOpen(true);
  };

  return (
    <footer className='w-full gap-2 flex flex-col-reverse md:flex-row justify-center items-center text-sm bg-background pb-2'>
      <div>
        <span className='text-font-bright flex items-center gap-2'>
          Created by
          <a
            className='text-spotify-green hover:text-spotify-green-highlight font-bold flex gap-2 align-middle items-center m-0 no-underline'
            href='//github.com/oskarprzybylski23'
            target='_blank'
          >
            <SiGithub />
            Oskar Przybylski
          </a>
          (2024)
        </span>
      </div>
      <ButtonWithTooltip
        className='hover:bg-opacity-0 text-spotify-green hover:text-spotify-green-highlight font-bold flex gap-2 align-middle m-0 no-underline'
        onClick={handleAboutDialogOpen}
        variant={'ghost'}
      >
        <p>·</p>
        <p>About Discofy</p>
        <p>·</p>
      </ButtonWithTooltip>
      {/* User Dialog Modal */}
      <UserDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={aboutDialogTitle}
      >
        {aboutDialogContent}
      </UserDialog>
    </footer>
  );
}
