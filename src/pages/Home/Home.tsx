import axios from 'axios';
import { useState, useEffect } from 'react';
import ListContainer from '../../components/listContainer/ListContainer';
import AlbumItem from '../../components/listContainer/AlbumItem';
import FolderItem from '../../components/listContainer/FolderItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserDialog } from '@/components/modal/userDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import {
  DiscogsAuthorizeResponse,
  DiscogsCheckAuthResponse,
  DiscogsLibraryResponse,
  DiscogsCollectionResponse,
  User,
  DiscogsFolder,
  DiscogsAlbumItem,
  SpotifyAlbumItem,
  SpotifyAuthorizeResponse,
  SpotifyAuthCheckResponse,
  SpotifyTransferResponse,
  CreatePlaylistResponse,
} from '../../types/discogs';

const BASE_URL = import.meta.env.VITE_API_URL;

const defaultUser: User = {
  loggedIn: false,
  name: '',
  profileUrl: '',
};

export default function Home() {
  const [discogsUser, setDiscogsUser] = useState<User>(defaultUser);
  const [spotifyUser, setSpotifyUser] = useState<User>(defaultUser);
  const [discogsIsLoading, setDiscogsIsLoading] = useState<boolean>(false);
  const [spotifyIsLoading, setSpotifyIsLoading] = useState<boolean>(false);
  const [discogsFolders, setDiscogsFolders] = useState<DiscogsFolder[]>([]);
  const [discogsFolderItemsCache, setDiscogsFolderItemsCache] = useState<
    Record<number, DiscogsAlbumItem[]>
  >({});
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<
    SpotifyAlbumItem[] | null
  >(null);
  const [playlistName, setPlaylistName] = useState<string>('');
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [notFoundItems, setNotFoundItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] =
    useState<React.ReactNode>('');
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);

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
      if (state) {
        const response = await axios.get<DiscogsCheckAuthResponse>(
          `${BASE_URL}/check_authorization?state=${state}`
        );
        if (response.data) {
          return response.data.authorized;
        } else return false;
      } else {
        // if no state means unauthorized
        return false;
      }
    } catch (error) {
      console.error('Error checking Discogs authorization:', error);
    }
  };
  // Check if user is logged in to Discogs or Spotify on page load
  useEffect(() => {
    const initializeUser = async () => {
      checkSpotifyAuthStatus();
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

      if (state) {
        const response = await axios.get<DiscogsLibraryResponse>(
          `${BASE_URL}/get_library?state=${state}`
        );

        const { user_info, library } = response.data;
        // TODO: move user info retrieval to checkDiscogsAuth()
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
        }
      }
    } catch (error) {
      console.error('Error importing from Discogs:', error);
    } finally {
      setDiscogsIsLoading(false);
    }
  };

  const handleFolderClick = (folderId: number, folderName: string) => {
    DiscogsImportFolderItems(folderId).catch((error) => {
      console.error('Error handling folder click:', error);
    });
    // give playlist name default value
    setPlaylistName(`Discogs Collection [${folderName}]`);
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
        const response = await axios.get<DiscogsCollectionResponse>(
          `${BASE_URL}/get_collection`,
          {
            params: { folder: folderId, state: state },
          }
        );

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
    localStorage.removeItem('discogs_state');
    // Clear user and cache + reset display
    setDiscogsUser({
      loggedIn: false,
      name: '',
      profileUrl: '',
    });
    setDiscogsFolders([]);
    setDiscogsFolderItemsCache({});
    setActiveFolderId(null);
    // TODO: create backend route /DiscogsLogout to handle backend logout actions
  };

  const handleSpotifyLogin = async () => {
    // Handle Spotify authorization protocol:
    // - get auth URL and state ID
    // - handle auth popup to prompt user to authorize
    // - once authorized, check Spotify auth status to get user info to be displayed
    try {
      const response = await axios.get<SpotifyAuthorizeResponse>(
        `${BASE_URL}/spotify_auth_url`
      );
      const { authorize_url, state } = response.data;

      if (!authorize_url) {
        console.error('No authorize URL received from backend.');
        return;
      }

      localStorage.setItem('spotify_state', state);

      // Add listener before opening popup
      const listener = (event: MessageEvent) => {
        if (event.data === 'authorizationComplete') {
          popup?.close();
          checkSpotifyAuthStatus();
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
        'Spotify Login',
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
      console.error('Error during Spotify login:', error);
    }
  };

  const checkSpotifyAuthStatus = async () => {
    try {
      const state = localStorage.getItem('spotify_state');

      if (state) {
        const response = await axios.get<SpotifyAuthCheckResponse>(
          `${BASE_URL}/check_spotify_authorization`,
          {
            params: { state },
            withCredentials: true,
          }
        );

        const user_info = response.data;

        if (user_info.authorized) {
          setSpotifyUser({
            loggedIn: true,
            name: user_info.username,
            profileUrl: user_info.url,
          });
        }
      }
    } catch (error) {
      console.error('Error checking Spotify authorization:', error);
    }
  };

  const handleSpotifyLogout = () => {
    localStorage.removeItem('spotify_state');
    // Clear user and cache + reset display
    setSpotifyUser({
      loggedIn: false,
      name: '',
      profileUrl: '',
    });
    setSpotifyPlaylist(null);
    // TODO: create backend route /DiscogsLogout to handle backend logout actions
  };

  const handleMoveCollection = async () => {
    try {
      if (spotifyUser.loggedIn && discogsUser.loggedIn) {
        if (activeFolderId) {
          setSpotifyIsLoading(true);
          const state = localStorage.getItem('spotify_state');
          const collection_items = discogsFolderItemsCache[activeFolderId];
          if (state) {
            const response = await axios.post<SpotifyTransferResponse>(
              `${BASE_URL}/transfer_to_spotify`,
              {
                state,
                collection: collection_items,
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            const exportData = response.data;
            handleExportData(exportData);
          }
        } else {
          console.error('No collection to move: folder not selected.');
        }
      } else {
        console.error(
          'To transfer collection user has to logged in to both Discogs and Spotify.'
        );
      }
    } catch (error) {
      console.error('Error getting Discogs items from Spotify catalog:', error);
    } finally {
      setSpotifyIsLoading(false);
    }
  };

  const handleExportData = (exportData: any) => {
    const playlistData: SpotifyAlbumItem[] = [];
    const notFoundItems = [];

    for (let i = 0; i < exportData.length; i++) {
      const item = exportData[i];
      if (item.found) {
        // Collect items that were matched successfully with Spotify albums
        playlistData.push({
          artist: item.artist,
          title: item.title,
          image: item.image,
          url: item.url,
          id: item.id,
          uri: item.uri,
          discogs_id: item.discogs_id,
          found: true,
        });
      } else {
        // Collect items that weren't found
        notFoundItems.push({
          ...item,
          notFound: true,
        });
        // TODO: handle flags for albums not found
      }
    }
    setNotFoundItems(notFoundItems);
    console.log(notFoundItems);
    setSpotifyPlaylist(playlistData);
  };

  const handleCreatePlaylist = async () => {
    try {
      if (spotifyUser.loggedIn) {
        if (spotifyPlaylist) {
          setSpotifyIsLoading(true);
          const state = localStorage.getItem('spotify_state');
          const playlist_items = spotifyPlaylist;
          if (state) {
            const response = await axios.post<CreatePlaylistResponse>(
              `${BASE_URL}/create_playlist`,
              {
                state,
                playlist: playlist_items,
                playlist_name: playlistName,
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.data.status == 'success' && response.data.url) {
              setPlaylistUrl(response.data.url);
              console.log(playlistUrl);
              // display user dialog
              setDialogTitle('Playlist Created!');
              setDialogDescription(
                'Your playlist was successfully created on Spotify.'
              );
              setDialogContent(
                <>
                  <p>
                    {spotifyPlaylist?.length} albums were added to your
                    playlist.
                  </p>
                  <p>
                    Check it out here:{' '}
                    <a
                      href={playlistUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline'
                    >
                      {playlistName}
                    </a>
                  </p>
                </>
              );
              setDialogOpen(true);
            } else {
              setDialogTitle('Error');
              setDialogDescription(
                'There was a problem creating your playlist.'
              );
              setDialogContent(
                <p>
                  Please try again later or check your Spotify account settings.
                </p>
              );
              setDialogOpen(true);
              console.error('Playlist could not be created this time.');
            }
          }
        } else {
          setDialogTitle('Error');
          setDialogDescription('There was a problem creating your playlist.');
          setDialogContent(
            <p>
              Please try again later or check your Spotify account settings.
            </p>
          );
          setDialogOpen(true);
          console.error('No playlist available to be created.');
        }
      } else {
        console.error(
          'To create a playlist user has to be logged in to Spotify.'
        );
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setSpotifyIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center space-y-6 w-full'>
      {/* Top action buttons */}
      <div className='flex flex-wrap gap-4 justify-center'>
        <Button
          onClick={
            discogsUser.loggedIn ? handleDiscogsLogout : handleDiscogsLogin
          }
          variant='secondary'
        >
          {discogsUser.loggedIn ? 'Disconnect Discogs' : 'Connect to Discogs'}
        </Button>
        <Button
          onClick={
            spotifyUser.loggedIn ? handleSpotifyLogout : handleSpotifyLogin
          }
          variant='secondary'
        >
          {spotifyUser.loggedIn ? 'Disconnect Spotify' : 'Connect to Spotify'}
        </Button>
        <Button disabled variant='secondary'>
          Save Report
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
                    key={`disc-${album.discogs_id}-${i}`}
                    index={i}
                    title={album.title}
                    artist={album.artist}
                    coverUrl={album.cover}
                    highlight={notFoundItems.some(
                      (item) => item.discogs_id === album.discogs_id
                    )}
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
                    handleFolderClick(
                      parseInt(folder.id.replace('f', '')),
                      folder.name
                    )
                  }
                />
              ))
            )}
          </ListContainer>
        </div>

        {/* Middle column with move button */}
        <div className='flex justify-center items-center p-8'>
          <Button
            onClick={handleMoveCollection}
            variant='secondary'
            disabled={
              !discogsUser.loggedIn || !spotifyUser.loggedIn || !activeFolderId
            }
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
                strokeWidth='1'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Button>
        </div>

        {/* Spotify list */}
        <div>
          <ListContainer
            title='Spotify Playlist'
            loggedInUser={spotifyUser}
            spinnerText='Fetching Spotify...'
            isLoading={spotifyIsLoading}
          >
            {spotifyPlaylist?.map((album, i) => (
              <AlbumItem
                key={`spot-${album.title}-${i}`}
                index={i}
                title={album.title}
                artist={album.artist}
                coverUrl={album.image}
              />
            ))}
          </ListContainer>
          {/* Playlist input + create button */}
          <div className='mt-4 flex gap-2'>
            <Input
              type='text'
              placeholder='Enter your playlist name'
              value={playlistName ? playlistName : undefined}
              disabled={!spotifyPlaylist}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <Button
              disabled={!spotifyPlaylist || playlistName.length == 0}
              onClick={handleCreatePlaylist}
              variant='default'
            >
              Create Playlist
            </Button>
          </div>
        </div>
      </div>
      {/* User Dialog Modal */}
      <UserDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        title={dialogTitle}
        description={dialogDescription}
      >
        {dialogContent}
      </UserDialog>
    </div>
  );
}
