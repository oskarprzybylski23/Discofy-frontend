import Button from '../../components/button/Button';
import ListContainer from '../../components/listContainer/ListContainer';
import AlbumItem from '../../components/listContainer/AlbumItem';
import FolderItem from '../../components/listContainer/FolderItem';

const mockAlbums = [
  {
    id: '1',
    title: 'Discovery',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
  {
    id: '2',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
  {
    id: '1',
    title: 'Discovery',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
  {
    id: '2',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
  {
    id: '1',
    title: 'Discovery',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
  {
    id: '2',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    cover: 'https://via.placeholder.com/100',
  },
];

const mockFolders = [
  {
    id: 'f1',
    name: 'Favorites',
    count: 12,
  },
  {
    id: 'f2',
    name: 'To Listen',
    count: 5,
  },
];

export default function Home() {
  return (
    <div className='flex flex-col items-center space-y-6 w-full'>
      {/* Top action buttons */}
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

      {/* Three column layout */}
      <div className='w-[90%] max-w-[1280px] grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4'>
        {/* Discogs list */}
        <div>
          <ListContainer
            title='Discogs Collection'
            loggedInUser={{
              name: 'oskar.przybylski23',
              profileUrl: 'https://discogs.com/user/oskar.przybylski23',
            }}
            spinnerText='Fetching Discogs...'
          >
            {mockFolders.map((folder, i) => (
              <FolderItem
                key={folder.id}
                index={i}
                name={folder.name}
                count={folder.count}
              />
            ))}
            {mockAlbums.map((album, i) => (
              <AlbumItem
                key={album.id}
                index={i}
                title={album.title}
                artist={album.artist}
                coverUrl={album.cover}
              />
            ))}
          </ListContainer>
        </div>

        {/* Middle column with move button */}
        <div className='flex justify-center items-center p-8'>
          <Button
            disabled
            onClick={() => console.log('Move Collection')}
            variant='secondary'
          >
            Move Collection
            <svg
              id='svg-arrow'
              height='16px'
              viewBox='0 0 16 16'
              fill='currentColor'
              xmlns='http://www.w3.org/2000/svg'
              className='inline ml-2 align-middle'
            >
              <path
                d='M4.97.47a.75.75 0 0 0 0 1.06L11.44 8l-6.47 6.47a.75.75 0 1 0 1.06 1.06L13.56 8 6.03.47a.75.75 0 0 0-1.06 0z'
                stroke-width='1'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
          </Button>
        </div>

        {/* Spotify list */}
        <div>
          <ListContainer
            title='Spotify Playlist'
            loggedInUser={{
              name: 'oskar_przybylski23',
              profileUrl: 'https://open.spotify.com/user/oskar_przybylski23',
            }}
            spinnerText='Fetching Spotify...'
          >
            {mockAlbums.map((album, i) => (
              <AlbumItem
                key={album.id}
                index={i}
                title={album.title}
                artist={album.artist}
                coverUrl={album.cover}
              />
            ))}
          </ListContainer>
          {/* Playlist input + create button */}
          <div className='mt-4 flex gap-2'>
            <input
              type='text'
              placeholder='Enter your playlist name'
              disabled
              className='rounded-full px-4 py-2 text-sm bg-white-background text-font-dark border border-gray-300 w-full'
            />
            <Button disabled>Create Playlist</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
