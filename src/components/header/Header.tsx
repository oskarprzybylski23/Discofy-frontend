export default function Header() {
  return (
    <header className='bg-background shadow-md py-4 px-6 flex flex-col gap-3 items-center text-center'>
      <div className='flex items-center space-x-2'>
        <img
          src='favicon.ico'
          alt='Discofy logo'
          className='w-7 h-7 bg-spotify-green rounded-xs'
        />
        <h1 className='text-4xl text-spotify-green font-bold'>Discofy</h1>
      </div>
      <h3 className='text-lg text-font-bright font-bold tracking-wide'>
        Export Your Discogs Collections to Spotify
      </h3>
    </header>
  );
}
