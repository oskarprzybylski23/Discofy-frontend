import axios from 'axios';
import { useState, useEffect } from 'react';
import ListContainer from '../../components/listContainer/ListContainer';
import AlbumItem from '../../components/listContainer/AlbumItem';
import FolderItem from '../../components/listContainer/FolderItem';
import { Input } from '@/components/ui/input';
import { UserDialog } from '@/components/modal/userDialog';
import { ButtonWithTooltip } from '@/components/button/buttonWithTooltip';
import { toast } from 'sonner';
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
  LogoutResponse,
} from '../../types/discogs';
import { ChevronLeft, ChevronRight, OctagonAlert } from 'lucide-react';
import { SiDiscogs, SiSpotify } from 'react-icons/si';

const BASE_URL = import.meta.env.VITE_API_URL;

// Create an API client with configuration for cross-origin requests
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  const [spinnerText, setSpinnerText] = useState<string>('');
  const [discogsFolders, setDiscogsFolders] = useState<DiscogsFolder[]>([]);
  const [discogsFolderItemsCache, setDiscogsFolderItemsCache] = useState<
    Record<number, DiscogsAlbumItem[]>
  >({});
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<
    SpotifyAlbumItem[] | null
  >(null);
  const [playlistName, setPlaylistName] = useState<string>('');
  const [notFoundItems, setNotFoundItems] = useState<SpotifyAlbumItem[]>([]);
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
      const response = await apiClient.post<DiscogsAuthorizeResponse>(
        `discogs/get_auth_url`,
        null,
        {
          withCredentials: true,
        }
      );

      const { authorize_url } = response.data;

      if (!authorize_url) {
        console.error('No authorize URL received from backend.');
        return;
      }

      // Add listener before opening popup
      const listener = (event: MessageEvent) => {
        if (event.data === 'authorizationComplete') {
          popup?.close();
          // Import user library once authorization is complete
          discogsImportUserFolders();
          toast.success('Discogs connected', {
            description: `You have successfully connected to your Discogs account!`,
          });

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
        toast.error('Discogs Authorization error', {
          description: `Authorization window could not be opened. Check for any popup blockers or try again later.`,
        });
        cleanup();
        return;
      }

      // Poll popup to detect early close
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          console.warn('Popup closed before auth completed.');
          toast.error('Discogs Authorization Incomplete', {
            description: `Authorization window was closed before authorization could be completed.`,
          });
          cleanup();
        }
      }, 500);
    } catch (error) {
      console.error('Error during Discogs login:', error);
      toast.error('Discogs Authorization Error', {
        description: `There was an error authorizing you to Discogs, please try again later.`,
      });
    }
  };

  const checkDiscogsAuthStatus = async () => {
    try {
      const response = await apiClient.get<DiscogsCheckAuthResponse>(
        `discogs/check_authorization`,
        { withCredentials: true }
      );

      if (response.data) {
        return response.data.authorized;
      } else {
        toast.error('Discogs Authorization Error', {
          description:
            'We could not verify your Discogs authorization. Please try again later.',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error checking Discogs authorization:', error);
      if (error.response?.status === 400) {
        // Handle error when state is not received by the backend
        toast.error('Discogs Authorization Error', {
          description:
            'An error occured while veryfing user authorization. Please try again later.',
        });
      } else {
        toast.error('Discogs Authorization Error', {
          description:
            'There was a problem checking your Discogs login status. Try again later!',
        });
      }
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
    setSpinnerText('Importing library...');
    setDiscogsIsLoading(true);
    try {
      const response = await apiClient.get<DiscogsLibraryResponse>(
        `discogs/get_library`,
        { withCredentials: true }
      );

      const { user_info, library } = response.data;
      // TODO: move user info retrieval to checkDiscogsAuth()
      if (user_info) {
        setDiscogsUser({
          loggedIn: true,
          name: user_info.username,
          profileUrl: user_info.url,
        });
      } else {
        console.warn('No user info returned from Discogs.');
        toast.error('Not logged into Discogs', {
          description: `Please connect your Discogs account to import your collection.`,
        });
        return;
      }

      if (library && Array.isArray(library)) {
        const formattedFolders = library.map((item: any, i: number) => ({
          id: `f${i}`,
          name: item.folder,
          count: parseInt(item.count),
        }));

        setDiscogsFolders(formattedFolders);
      } else {
        // handle case when returned library is empty
        toast.error('Discogs Record Collection', {
          description: `It seems that your record collection is empty. Add some records and try again.`,
        });
        console.warn('No library folders returned or invalid format.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Discogs user unauthourized', {
            description: `You are not authorized or your session expired. Please log in.`,
          });
        } else {
          toast.error('Discogs Connection', {
            description: `We couldn't get your record collection this time, try again later!`,
          });
        }
        console.error(
          'Error importing from Discogs:',
          error.response?.data || error.message
        );
      } else {
        toast.error('Discogs Connection', {
          description: `We couldn't get your record collection this time, try again later!`,
        });
        console.error('Unknown error importing from Discogs:', error);
      }
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
      setSpinnerText('Getting folder contents...');
      setDiscogsIsLoading(true);
      const response = await apiClient.get<DiscogsCollectionResponse>(
        `discogs/get_folder_contents`,
        {
          params: { folder: folderId },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        // Cache the folder items
        // TODO: set item data more explicitly to avoid API response mismatch introducing bugs
        setDiscogsFolderItemsCache((prev) => ({
          ...prev,
          [folderId]: response.data,
        }));

        // Show the folder
        setActiveFolderId(folderId);
      }
    } catch (error) {
      toast.error('Discogs Import Error', {
        description: `An error occured when trying to get your record collection. Try again later!`,
      });
    } finally {
      setDiscogsIsLoading(false);
    }
  };

  const handleDiscogsLogout = async () => {
    try {
      const response = await apiClient.post<LogoutResponse>(`discogs/logout`, {
        withCredentials: true,
      });

      if (response.data.status == 'success')
        // Clear user and cache + reset display
        setDiscogsUser({
          loggedIn: false,
          name: '',
          profileUrl: '',
        });
      setDiscogsFolders([]);
      setDiscogsFolderItemsCache({});
      setActiveFolderId(null);
      toast.success('Discogs disconnected', {
        description: `You have been successfully disconnected from Discogs!`,
      });
    } catch (error: any) {
      // handle better
      console.error('Error disconnecting from Discogs:', error);
      toast.error('Error', {
        description: `We encountered an error while disconnecting you from Discogs.`,
      });
    }
  };

  const handleSpotifyLogin = async () => {
    // Handle Spotify authorization protocol:
    // - get auth URL and state ID
    // - handle auth popup to prompt user to authorize
    // - once authorized, check Spotify auth status to get user info to be displayed
    try {
      const response =
        await apiClient.get<SpotifyAuthorizeResponse>(`spotify/get_auth_url`);
      const { authorize_url } = response.data;
      if (!authorize_url) {
        console.error('Missing authorize_url backend response:', response.data);
        toast.error('Spotify Connection Error', {
          description: `We couldn't connect your Spotify account this time. Try again later!`,
        });
        return;
      }

      // Add listener before opening popup
      const listener = (event: MessageEvent) => {
        if (event.data === 'authorizationComplete') {
          popup?.close();
          checkSpotifyAuthStatus();

          toast.success('Spotify Connected', {
            description: `You have successfully connected to your Spotify account!`,
          });
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
        toast.error('Popup Blocked', {
          description: `We couldn’t open the Spotify login window. Please allow popups and try again.`,
        });
        cleanup();
        return;
      }

      // Poll popup to detect early close
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          console.warn('Popup closed before auth completed.');
          toast.error('Spotify Authorization Incomplete', {
            description: `Authorization window was closed before authorization could be completed.`,
          });
          cleanup();
        }
      }, 500);
    } catch (error: any) {
      console.error('Error during Spotify login:', error);
      toast.error('Spotify Connection Error', {
        description: `We couldn't connect your Spotify account this time. Try again later!`,
      });
    }
  };

  const checkSpotifyAuthStatus = async () => {
    try {
      const response = await apiClient.get<SpotifyAuthCheckResponse>(
        `spotify/check_authorization`,
        {
          withCredentials: true,
        }
      );

      const user_info = response.data;

      if (user_info?.authorized) {
        setSpotifyUser({
          loggedIn: true,
          name: user_info.username,
          profileUrl: user_info.url,
        });
      } else {
        return;
      }
    } catch (error: any) {
      console.error('Error checking Spotify authorization:', error);
      toast.error('Spotify Authorization Error', {
        description: `We couldn’t verify your Spotify login. Try again later!`,
      });
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      const response = await apiClient.post<LogoutResponse>(`spotify/logout`, {
        withCredentials: true,
      });
      if (response.data.status == 'success')
        // Clear user and cache + reset display
        setSpotifyUser({
          loggedIn: false,
          name: '',
          profileUrl: '',
        });
      setSpotifyPlaylist(null);
      setPlaylistName('');
      toast.success('Spotify disconnected', {
        description: `You have been successfully disconnected from Spotify!`,
      });
    } catch (error: any) {
      // handle better
      console.error('Error disconnecting from Discogs:', error);
      toast.error('Error', {
        description: `We encountered an error while disconnecting you from Discogs.`,
      });
    }
  };

  const handleMoveCollection = async () => {
    try {
      if (!discogsUser.loggedIn || !spotifyUser.loggedIn) {
        toast.error('Login Required', {
          description:
            'You must be connected to both Discogs and Spotify to move your collection.',
        });
        return;
      }

      if (activeFolderId === null) {
        toast.error('No Folder Selected', {
          description: 'Please select a folder to transfer before proceeding.',
        });
        return;
      }

      const collection_items = discogsFolderItemsCache[activeFolderId];
      if (!collection_items || collection_items.length === 0) {
        toast.error('Empty Collection', {
          description: 'The selected folder has no items to transfer.',
        });
        return;
      }
      setSpinnerText('Finding matching albums...');
      setSpotifyIsLoading(true);

      const response = await apiClient.post<SpotifyTransferResponse>(
        `spotify/transfer_collection`,
        {
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
      const { playlistData, notFoundItems } = handleExportData(exportData);

      if (playlistData?.length > 0) {
        setDialogTitle('Transfer Successful!');
        setDialogDescription(
          'We found matching Spotify albums for your record collection'
        );
      } else {
        setDialogTitle('Transfer Failed!');
        setDialogDescription('We couldn not find any matching Spotify albums');
      }

      setDialogContent(
        <>
          {playlistData?.length > 0 ? (
            <p>
              <strong>{playlistData?.length}</strong>{' '}
              {playlistData.length > 1 ? 'albums were' : 'album was'} added to
              the playlist creator.
            </p>
          ) : (
            <p className='text-failed flex gap-2'>
              <OctagonAlert className='text-spotify-green' size={24} />
              We couldn't find matching albums for your collection this time.
            </p>
          )}
          {notFoundItems?.length > 0 ? (
            <>
              <p className='text-failed flex gap-2'>
                <OctagonAlert className='text-spotify-green' size={24} />
                <strong>{notFoundItems.length}</strong> album
                {notFoundItems.length > 1 ? 's' : ''} could not be exported.
              </p>
              <p>This usually happens if:</p>
              <ul className='list-disc list-inside ml-4'>
                <li>Album isn't available in Spotify’s catalog, or</li>
                <li>Names differ too much between Discogs and Spotify.</li>
              </ul>
              <p>
                {' '}
                These unmatched albums are highlighted in{' '}
                <span className='text-failed'>red</span> in your Discogs
                Collection.
              </p>
            </>
          ) : (
            <p className='text-spotify-green'>
              All albums in your collection were successfully matched with items
              in the Spotify catalog.
            </p>
          )}
          <p className='mt-2'>
            Please review the matched albums to ensure they’re correct. While we
            aim to ensure high accuracy, metadata inconsistencies can lead to
            mismatches.
          </p>
          <p className='mt-2'>
            You can make adjustments to the playlist before finalizing it. When
            you're ready, click <strong>'Create Playlist'</strong>.
          </p>
        </>
      );
      setDialogOpen(true);
    } catch (error: any) {
      console.error('Error transferring Discogs items to Spotify:', error);
      toast.error('Transfer Failed', {
        description: `Something went wrong while moving your collection. Please try again.`,
      });
    } finally {
      setSpotifyIsLoading(false);
    }
  };

  const handleExportData = (exportData: any) => {
    const playlistData: SpotifyAlbumItem[] = [];
    const notFoundItems: SpotifyAlbumItem[] = [];

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
          disabled: false,
        });
      } else {
        // Collect items that weren't found
        notFoundItems.push({
          artist: item.artist,
          title: item.title,
          image: item.image,
          url: item.url,
          id: item.id,
          uri: item.uri,
          discogs_id: item.discogs_id,
          found: true,
          disabled: false,
        });
      }
    }
    setNotFoundItems(notFoundItems);
    setSpotifyPlaylist(playlistData);

    return { playlistData, notFoundItems };
  };

  const handleCreatePlaylist = async () => {
    try {
      if (spotifyUser.loggedIn) {
        if (spotifyPlaylist) {
          setSpinnerText('Creating playlist...');
          setSpotifyIsLoading(true);
          const enabledAlbums =
            spotifyPlaylist?.filter((album) => !album.disabled) || [];

          // Only proceed if there are enabled albums to add to the playlist
          if (enabledAlbums.length === 0) {
            toast.error('No albums selected', {
              description:
                'Please select at least one album to create a playlist',
            });
            return;
          }
          const response = await apiClient.post<CreatePlaylistResponse>(
            `spotify/create_playlist`,
            {
              playlist: enabledAlbums,
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
            const url = response.data.url;
            // display user dialog
            setDialogTitle('Playlist Created!');
            setDialogDescription(
              'Your playlist was successfully created on Spotify.'
            );
            setDialogContent(
              <>
                <p>
                  <strong>{enabledAlbums?.length}</strong>{' '}
                  {enabledAlbums?.length === 1 ? 'album was' : 'albums were'}{' '}
                  added to your playlist.
                </p>
                <p>You can view it on Spotify:</p>
                <a
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:underline text-spotify-green'
                >
                  <strong>{playlistName}</strong>
                </a>
                <p>
                  Thank you for using <strong>Discofy</strong>!
                </p>
                <p>
                  This is an open-source project. Want to contribute or report
                  an issue?{' '}
                </p>
                <strong>
                  <a
                    href='https://github.com/oskarprzybylski23/Discofy-frontend'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline'
                  >
                    Visit the GitHub repo
                  </a>
                </strong>
              </>
            );
            setDialogOpen(true);
          } else {
            setDialogTitle('Playlist Creation Error');
            setDialogDescription('There was a problem creating your playlist.');
            setDialogContent(
              <>
                <p>
                  Please try again later or check your Spotify account
                  permissions and connection status.
                </p>
                <p>
                  If you think this is a bug, you can report it on our GitHub.
                  This way we can fix it quicker.{' '}
                  <a
                    href='https://github.com/oskarprzybylski23/Discofy-frontend/issues/new'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline'
                  >
                    <strong>Report an Issue</strong>
                  </a>
                  .
                </p>
              </>
            );
            setDialogOpen(true);
          }
        } else {
          setDialogTitle('Error');
          setDialogDescription('There was a problem creating your playlist.');
          setDialogContent(
            <>
              <p>
                Please try again later or check your Spotify account permissions
                and connection status.
              </p>
              <p>
                If you think this is a bug, you can report it on our GitHub.
                This way we can fix it quicker.{' '}
                <a
                  href='https://github.com/oskarprzybylski23/Discofy-frontend/issues/new'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline'
                >
                  Report an Issue
                </a>
                .
              </p>
            </>
          );
          setDialogOpen(true);
          console.error('No playlist available to be created.');
        }
      } else {
        toast.error('Spotify Authorization Error', {
          description: `It looks like you are not connected to Spotify. Try logging in.`,
        });
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Creating Spotify Playlist Failed', {
        description: `We couldn't create your playlist this time. Try again later.`,
      });
    } finally {
      setSpotifyIsLoading(false);
    }
  };

  const handleTogglePlaylistItem = (indexToToggle: number) => {
    if (spotifyPlaylist) {
      // Create a new array with the toggled item
      const updatedPlaylist = spotifyPlaylist.map((album, index) => {
        if (index === indexToToggle) {
          // Toggle the disabled status
          return { ...album, disabled: !album.disabled };
        }
        return album;
      });

      setSpotifyPlaylist(updatedPlaylist);
    }
  };

  return (
    <div className='flex flex-col items-center space-y-6 w-full'>
      {/* Top action buttons */}
      <div className='flex flex-wrap gap-4 justify-center'>
        <ButtonWithTooltip
          onClick={
            discogsUser.loggedIn ? handleDiscogsLogout : handleDiscogsLogin
          }
          variant={discogsUser.loggedIn ? 'destructive' : 'secondary'}
        >
          <SiDiscogs />
          {discogsUser.loggedIn ? 'Disconnect Discogs' : 'Connect to Discogs'}
        </ButtonWithTooltip>
        <ButtonWithTooltip
          onClick={
            spotifyUser.loggedIn ? handleSpotifyLogout : handleSpotifyLogin
          }
          variant={spotifyUser.loggedIn ? 'destructive' : 'secondary'}
        >
          <SiSpotify className='text-spotify-green' />
          {spotifyUser.loggedIn ? 'Disconnect Spotify' : 'Connect to Spotify'}
        </ButtonWithTooltip>
      </div>

      {/* Three column layout */}
      <div className='w-[90%] min-h-[400px] max-w-[1280px] grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4'>
        {/* Discogs column */}
        <div className='flex flex-col'>
          <div className='h-[min(500px,max(300px,60vh))]'>
            <ListContainer
              title='Discogs Collection'
              loggedInUser={discogsUser}
              placeholderText='Connect to Discogs to explore your collection'
              spinnerText={spinnerText}
              isLoading={discogsIsLoading}
            >
              {activeFolderId !== null ? (
                <>
                  {discogsFolderItemsCache[activeFolderId]?.map((album, i) => (
                    <AlbumItem
                      key={`disc-${album.discogs_id}-${i}`}
                      index={i}
                      title={album.title}
                      artist={album.artist}
                      coverUrl={album.cover}
                      url={album.url}
                      highlight={notFoundItems.some(
                        (item) => item.discogs_id === album.discogs_id
                      )}
                      toggleable={false} // do not allow for toggling discogs items for now
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
          {/* Back button */}
          <div className='mt-4'>
            <ButtonWithTooltip
              onClick={() => setActiveFolderId(null)}
              variant='secondary'
              disabled={activeFolderId == null}
              size='icon'
              showTooltip={true}
              tooltip='Go back'
              tooltipOffset={10}
              tooltipSide='bottom'
            >
              <ChevronLeft />
            </ButtonWithTooltip>
          </div>
        </div>

        {/* Middle column with move button */}
        <div className='flex justify-center items-center p-8'>
          <ButtonWithTooltip
            onClick={handleMoveCollection}
            variant='secondary'
            disabled={
              !discogsUser.loggedIn ||
              !spotifyUser.loggedIn ||
              activeFolderId === null
            }
            showTooltip={true}
            tooltip='Find your records in Spotify'
            tooltipOffset={10}
            tooltipSide='bottom'
          >
            Export
            <ChevronRight />
          </ButtonWithTooltip>
        </div>

        {/* Spotify column */}
        <div className='flex flex-col'>
          <div className='h-[min(500px,max(300px,60vh))]'>
            <ListContainer
              title='Spotify Playlist'
              loggedInUser={spotifyUser}
              placeholderText='Import items from Discogs to create a playlist'
              spinnerText={spinnerText}
              isLoading={spotifyIsLoading}
            >
              {spotifyPlaylist?.map((album, i) => (
                <AlbumItem
                  key={`spot-${album.title}-${i}`}
                  index={i}
                  title={album.title}
                  artist={album.artist}
                  coverUrl={album.image}
                  url={album.url}
                  toggleable={true}
                  disabled={album.disabled}
                  onToggle={() => handleTogglePlaylistItem(i)}
                />
              ))}
            </ListContainer>
          </div>
          {/* Playlist input + create button*/}
          <div className='mt-4 flex gap-2 flex-wrap justify-end lg:flex-nowrap'>
            <Input
              type='text'
              placeholder='Enter your playlist name'
              value={playlistName || ''}
              disabled={!spotifyPlaylist}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <ButtonWithTooltip
              disabled={!spotifyPlaylist || playlistName.length == 0}
              onClick={handleCreatePlaylist}
              variant='default'
            >
              Create Playlist
            </ButtonWithTooltip>
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
