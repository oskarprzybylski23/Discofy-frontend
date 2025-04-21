import axios from 'axios';
import { useState, useEffect } from 'react';
import Button from '../../components/button/Button';
import ListContainer from '../../components/listContainer/ListContainer';
import AlbumItem from '../../components/listContainer/AlbumItem';
import FolderItem from '../../components/listContainer/FolderItem';
import {
  DiscogsAuthorizeResponse,
  DiscogsCheckAuthResponse,
  DiscogsLibraryResponse,
  DiscogsUser,
  DiscogsFolder,
} from '../../types/discogs';

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

const BASE_URL = import.meta.env.VITE_API_URL;

const defaultDiscogsUser: DiscogsUser = {
  loggedIn: false,
  name: '',
  profileUrl: '',
};

export default function Home() {
  const [discogsUser, setDiscogsUser] =
    useState<DiscogsUser>(defaultDiscogsUser);
  const [discogsIsLoading, setDiscogsIsLoading] = useState(false);
  const [discogsFolders, setDiscogsFolders] = useState<DiscogsFolder[]>([]);
  const [discogsFolderItemsCache, setDiscogsFolderItemsCache] = useState<
    Record<number, any[]>
  >({});
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);

  const handleDiscogsLogin = async () => {
    // Handle Discogs authorization protocol:
    // - get auth URL and state ID
    // - handle auth popup to prompt user to authorize
    // - import user library if authorization is successfull
    try {
      const response = await axios.post<DiscogsAuthorizeResponse>(
        `${BASE_URL}/authorize_discogs`,
        null,
        {
          withCredentials: true,
        }
      );

      const { authorize_url, state } = response.data;

      if (!authorize_url) {
        console.error('No authorize URL received from backend.');
        return;
      }

      console.log(
        'Redirecting to Discogs authorization URL with state:',
        state
      );
      localStorage.setItem('discogs_state', state);

      // Add listener before opening popup
      const listener = (event: MessageEvent) => {
        if (event.data === 'authorizationComplete') {
          popup?.close();
          // Import user library once authorization is complete
          discogsImportUserFolders();
          cleanup();
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', listener);
        clearInterval(popupCheckInterval);
      };

      window.addEventListener('message', listener);

      // Open popup
      const popup = window.open(
        authorize_url,
        'Discogs Login',
        'width=600,height=700'
      );

      if (!popup) {
        console.error('Popup was blocked.');
        cleanup();
        return;
      }

      // Poll popup to detect early close
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          console.warn('Popup closed before auth completed.');
          cleanup();
        }
      }, 500);
    } catch (error) {
      console.error('Error during Discogs login:', error);
    }
  };

  const checkDiscogsAuthStatus = async () => {
    try {
      const state = localStorage.getItem('discogs_state');
      console.log(`checking authorization with state ${state}...`);

      if (state) {
        const response = await axios.get<DiscogsCheckAuthResponse>(
          `${BASE_URL}/check_authorization?state=${state}`
        );
        if (response.data.authorized) {
          console.log('User is authorized with Discogs');

          return true;
        } else {
          console.log('User is not authorized with Discogs');
          return false;
        }
      } else {
        console.log('user state not present');
        return false;
      }
    } catch (error) {
      console.error('Error checking Discogs authorization:', error);
    }
  };
  // Check if user is logged in to Discogs on page load
  useEffect(() => {
    const initializeUser = async () => {
      if (discogsUser.loggedIn) return; // Avoid re-import if already logged in

      const isAuthorized = await checkDiscogsAuthStatus();
      if (isAuthorized) {
        await discogsImportUserFolders();
      }
    };

    initializeUser();
  }, []);

  const discogsImportUserFolders = async () => {
    try {
      setDiscogsIsLoading(true);
      const state = localStorage.getItem('discogs_state');
      //   const userAuthorized = await checkDiscogsAuthStatus();

      if (state) {
        const response = await axios.get<DiscogsLibraryResponse>(
          `${BASE_URL}/get_library?state=${state}`
        );
        console.log(response.data);
        const { user_info, library } = response.data;

        if (user_info) {
          setDiscogsUser({
            loggedIn: true,
            name: user_info.username,
            profileUrl: user_info.url,
          });
        }

        if (library) {
          const formattedFolders = library.map((item: any, i: number) => ({
            id: `f${i}`,
            name: item.folder,
            count: parseInt(item.count),
          }));

          setDiscogsFolders(formattedFolders);
          setDiscogsIsLoading(false);
        }
      } else {
        console.log(
          'importing Discogs Library failed: User is not authorized.'
        );
      }
    } catch (error) {
      console.error('Error importing from Discogs:', error);
    }
  };

  const handleFolderClick = (folderId: number) => {
    DiscogsImportFolderItems(folderId).catch((error) => {
      console.error('Error handling folder click:', error);
    });
  };

  const DiscogsImportFolderItems = async (folderId: number) => {
    // If cached, just update active folder ID to display contents
    if (discogsFolderItemsCache[folderId]) {
      setActiveFolderId(folderId);
      return;
    }
    // Else, fetch folder items
    try {
      setDiscogsIsLoading(true);
      const state = localStorage.getItem('discogs_state');

      if (state) {
        const response = await axios.get(`${BASE_URL}/get_collection`, {
          params: { folder: folderId, state: state },
        });

        if (response.data && Array.isArray(response.data)) {
          // Cache the folder items
          setDiscogsFolderItemsCache((prev) => ({
            ...prev,
            [folderId]: response.data,
          }));

          // Show the folder
          setActiveFolderId(folderId);
        }
      }
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    } finally {
      setDiscogsIsLoading(false);
    }
  };

  const handleDiscogsLogout = () => {
    localStorage.clear();
    // Clear user and cache + reset display
    setDiscogsUser({
      loggedIn: false,
      name: '',
      profileUrl: '',
    });
    setDiscogsFolders([]);
    setDiscogsFolderItemsCache([]);
    setActiveFolderId(null);
  };

  return (
    <div className='flex flex-col items-center space-y-6 w-full'>
      {/* Top action buttons */}
      <div className='flex flex-wrap gap-4 justify-center'>
        <Button onClick={handleDiscogsLogin} variant='secondary'>
          Import from Discogs
        </Button>
        <Button onClick={() => console.log('Spotify')} variant='secondary'>
          Login to Spotify
        </Button>
        <Button disabled variant='secondary'>
          Save Report
        </Button>
        <Button onClick={handleDiscogsLogout} variant='secondary'>
          Logout
        </Button>
      </div>

      {/* Three column layout */}
      <div className='w-[90%] max-w-[1280px] grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4'>
        {/* Discogs list */}
        <div>
          <ListContainer
            title='Discogs Collection'
            loggedInUser={discogsUser}
            spinnerText='Fetching Discogs...'
            isLoading={discogsIsLoading}
          >
            {activeFolderId !== null ? (
              <>
                <Button
                  onClick={() => setActiveFolderId(null)}
                  variant='secondary'
                  className='mb-2'
                >
                  ← Back to folders
                </Button>
                {discogsFolderItemsCache[activeFolderId]?.map((album, i) => (
                  <AlbumItem
                    key={`${album.title}-${i}`}
                    index={i}
                    title={album.title}
                    artist={album.artist}
                    coverUrl={album.cover}
                  />
                ))}
              </>
            ) : (
              discogsFolders.map((folder, i) => (
                <FolderItem
                  key={folder.id}
                  index={i}
                  name={folder.name}
                  count={folder.count}
                  onClick={() =>
                    handleFolderClick(parseInt(folder.id.replace('f', '')))
                  }
                />
              ))
            )}
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
              loggedIn: true,
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
