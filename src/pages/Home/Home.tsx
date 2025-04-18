import Button from '../../components/button/Button';

export default function Home() {
  return (
    <div className='space-y-6 w-full'>
      <div className='flex flex-wrap gap-4 justify-center'>
        <Button onClick={() => console.log('Discogs')} variant='secondary'>
          Import from Discogs
        </Button>
        <Button onClick={() => console.log('Spotify')} variant='secondary'>
          Login to Spotify
        </Button>
        <Button disabled variant='secondary'>
          Save Report
        </Button>
        <Button onClick={() => console.log('Logout')} variant='secondary'>
          Logout
        </Button>
      </div>
      {/* Add your DiscogsList and SpotifyList here later */}
    </div>
  );
}
