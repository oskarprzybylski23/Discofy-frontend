export default function Header() {
  return (
    <header className='bg-background shadow-md py-4 px-6 flex flex-col gap-3 items-center'>
      <div className='flex items-center space-x-2'>
        <img
          src='favicon.ico'
          alt='Discofy logo'
          className='w-6 h-6 bg-spotify-green'
        />
        <h1 className='text-4xl text-spotify-green font-bold'>Discofy</h1>
      </div>
      <h3 className='text-md text-font-bright'>
        Export Discogs Collection to Spotify
      </h3>
    </header>
  );
}
