export default function Home() {
  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap gap-4 justify-center'>
        <button className='btn'>Import from Discogs</button>
        <button className='btn'>Login to Spotify</button>
        <button className='btn' disabled>
          Save Report
        </button>
        <button className='btn' disabled>
          Logout
        </button>
      </div>
      {/* Add your DiscogsList and SpotifyList here later */}
    </div>
  );
}
