import { useState, useEffect } from 'react';
import ListContainer from '../../components/listContainer/ListContainer';
import AlbumItem from '../../components/listContainer/AlbumItem';
import FolderItem from '../../components/listContainer/FolderItem';
import { Input } from '@/components/ui/input';
import { UserDialog } from '@/components/modal/userDialog';
import { ButtonWithTooltip } from '@/components/button/buttonWithTooltip';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, OctagonAlert } from 'lucide-react';
import { SiDiscogs, SiSpotify } from 'react-icons/si';
import {
  DiscogsFolder,
  DiscogsAlbumItem,
  DiscogsLibraryFolderResponse,
} from '../../types/discogs';
import { SpotifyAlbumItem } from '@/types/spotify';
import { User } from '@/types/shared';
import {
  getDiscogsAuthUrl,
  checkDiscogsAuthStatus as apiCheckDiscogsAuthStatus,
  getDiscogsLibrary,
  getDiscogsFolderContents,
  discogsLogout,
  getSpotifyAuthUrl,
  checkSpotifyAuthStatus as apiCheckSpotifyAuthStatus,
  spotifyLogout,
  transferCollectionToSpotify,
  createSpotifyPlaylist,
  getTransferCollectionStatus,
} from '../../lib/api';
import { handleExportData, openAuthPopup } from '../../lib/homeUtils';

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
  const [discogsSpinnerText, setDiscogsSpinnerText] = useState<string>('');
  const [spotifySpinnerText, setSpotifySpinnerText] = useState<string>('');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>(' ');
  const [discogsFolders, setDiscogsFolders] = useState<DiscogsFolder[]>([]);
  const [discogsFolderItemsCache, setDiscogsFolderItemsCache] = useState<
    Record<number, DiscogsAlbumItem[]>
  >({});
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<
    SpotifyAlbumItem[] | []
  >([]);
  const [playlistName, setPlaylistName] = useState<string>('');
  const [notFoundItems, setNotFoundItems] = useState<SpotifyAlbumItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] =
    useState<React.ReactNode>('');
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);

  const handleDiscogsLogin = async () => {
    try {
      const response = await getDiscogsAuthUrl();
      const { authorize_url } = response.data;
      if (!authorize_url) {
        console.error('No authorize URL received from backend.');
        return;
      }
      // Open a popup window for Discogs OAuth authentication
      openAuthPopup(
        authorize_url,
        // Success callback - runs when auth is successful
        async () => {
          discogsImportUserFolders();
          toast.success('Discogs connected', {
            description: `You have successfully connected to your Discogs account!`,
          });
        },
        // Error callback - runs if auth fails
        (reason) => {
          toast.error('Discogs Authorization error', {
            description: reason,
          });
        },
        // Auth check callback - polls to check if auth is complete
        async () => {
          const userStatus = await checkDiscogsAuthStatus();

          return userStatus?.authorized === true;
        }
      );
    } catch (error) {
      console.error('Error during Discogs login:', error);
      toast.error('Discogs Authorization Error', {
        description: `There was an error authorizing you to Discogs, please try again later.`,
      });
    }
  };

  // Check if user is authorized with Discogs and update user state accordingly
  const checkDiscogsAuthStatus = async () => {
    try {
      const response = await apiCheckDiscogsAuthStatus();
      const user_info = response.data;

      if (user_info?.authorized) {
        // If authorized, update user state
        setDiscogsUser({
          loggedIn: true,
          name: user_info.username,
          profileUrl: user_info.url,
        });

        return user_info;
      } else {
        // Return default unauthorized user object
        return {
          authorized: false,
          username: '',
          id: null,
          url: '',
        };
      }
    } catch (error: unknown) {
      console.error('Error checking Discogs authorization:', error);
      toast.error('Discogs Authorization Error', {
        description:
          'There was a problem checking your Discogs login status. Try again later!',
      });
    }
  };

  const discogsImportUserFolders = async () => {
    setDiscogsSpinnerText('Importing library...');
    setDiscogsIsLoading(true);
    try {
      const response = await getDiscogsLibrary();
      const { folders } = response.data;

      if (folders && Array.isArray(folders)) {
        const formattedFolders = folders.map(
          (item: DiscogsLibraryFolderResponse, i: number) => ({
            id: `f${i}`,
            name: item.folder,
            count: parseInt(item.count),
          })
        );
        setDiscogsFolders(formattedFolders);
      } else {
        // handle case when returned library is empty
        toast.error('Discogs Record Collection', {
          description: `It seems that your record collection is empty. Add some records and try again.`,
        });
      }
    } catch (error: unknown) {
      toast.error('Discogs Connection', {
        description: `We couldn't get your record collection this time, try again later!`,
      });
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
      setDiscogsSpinnerText('Getting folder contents...');
      setDiscogsIsLoading(true);
      const response = await getDiscogsFolderContents(folderId);
      if (response.data && Array.isArray(response.data)) {
        // Cache the folder items
        // TODO: set item data more explicitly to avoid API response mismatch introducing bugs
        setDiscogsFolderItemsCache((prev) => ({
          ...prev,
          [folderId]: response.data,
        }));

        // Show the folder contents
        setActiveFolderId(folderId);
      }
    } catch {
      toast.error('Discogs Import Error', {
        description: `An error occured when trying to get your record collection. Try again later!`,
      });
    } finally {
      setDiscogsIsLoading(false);
    }
  };

  const handleDiscogsLogout = async () => {
    try {
      const response = await discogsLogout();
      if (response.data.status == 'success') {
        // Clear user and cache + reset display
        setDiscogsUser(defaultUser);
        setDiscogsFolders([]);
        setDiscogsFolderItemsCache({});
        setActiveFolderId(null);
        toast.success('Discogs disconnected', {
          description: `You have been successfully disconnected from Discogs!`,
        });
      }
    } catch (error: unknown) {
      console.error('Error disconnecting from Discogs:', error);
      toast.error('Error', {
        description: `We encountered an error while disconnecting you from Discogs.`,
      });
    }
  };

  const handleSpotifyLogin = async () => {
    {
      /* Spotify API limit temporary solution while resolving Spotify API quota extensions issues */
    }
    toast.error('Spotify Restrictions', {
      description:
        'Due to Spotify API changes, we are not able to offer this app to everyone at the moment. If you would like to get experimental access consider getting in touch via the email in the banner.',
    });
    try {
      const response = await getSpotifyAuthUrl();
      const { authorize_url } = response.data;
      if (!authorize_url) {
        console.error('Missing authorize_url backend response:', response.data);
        toast.error('Spotify Connection Error', {
          description: `We couldn't connect your Spotify account this time. Try again later!`,
        });
        return;
      }
      openAuthPopup(
        authorize_url,
        () => {
          checkSpotifyAuthStatus();
          toast.success('Spotify Connected', {
            description: `You have successfully connected to your Spotify account!`,
          });
        },
        (reason) => {
          toast.error('Spotify Connection Error', {
            description: reason,
          });
        },
        async () => {
          await checkSpotifyAuthStatus();
          const resp = await apiCheckSpotifyAuthStatus();
          return !!(resp.data && resp.data.authorized);
        }
      );
    } catch (error: unknown) {
      console.error('Error during Spotify login:', error);
      toast.error('Spotify Connection Error', {
        description: `We couldn't connect your Spotify account this time. Try again later!`,
      });
    }
  };

  const checkSpotifyAuthStatus = async () => {
    try {
      const response = await apiCheckSpotifyAuthStatus();
      const user_info = response.data;
      if (user_info?.authorized) {
        setSpotifyUser({
          loggedIn: true,
          name: user_info.username,
          profileUrl: user_info.url,
        });
      }
    } catch (error: unknown) {
      console.error('Error checking Spotify authorization:', error);
      toast.error('Spotify Authorization Error', {
        description: `We couldn't verify your Spotify login. Try again later!`,
      });
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      const response = await spotifyLogout();
      if (response.data.status == 'success') {
        // Clear user and cache + reset display
        setSpotifyUser(defaultUser);
        setSpotifyPlaylist([]);
        setPlaylistName('');
        toast.success('Spotify disconnected', {
          description: `You have been successfully disconnected from Spotify!`,
        });
      }
    } catch (error: unknown) {
      console.error('Error disconnecting from Spotify:', error);
      toast.error('Error', {
        description: `We encountered an error while disconnecting you from Spotify.`,
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
      // TODO: Implement filtering in UI
      // Exclude 'Singles' from transfered items
      const collection_filtered = collection_items.filter(
        (item) => !item.descriptions?.includes('Single')
      );
      if (!collection_filtered || collection_filtered.length === 0) {
        toast.error('Empty Collection', {
          description: 'The selected folder has no items to transfer.',
        });
        return;
      }
      setSpotifySpinnerText('Finding matching albums...');
      setSpotifyIsLoading(true);
      setExportProgress(1);
      // Start the transfer (celery task in backend) and get task_id and progress_key
      const response = await transferCollectionToSpotify(collection_filtered);
      const { task_id, progress_key } = response.data;

      // Poll for progress and result
      let finished = false;
      let result = null;
      let progress = { current: 0, total: 1 };
      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait interval between polls
        const statusResp = await getTransferCollectionStatus(
          task_id,
          progress_key
        );
        const { state, progress: prog, result: res } = statusResp.data;

        // Update progress
        if (prog) {
          progress = prog;
          setProgressText(`${progress.current} out of ${progress.total}`);
          const progressValue = (progress.current / progress.total) * 100; // calculate progress percentage
          setExportProgress(progressValue);
        }

        if (state === 'SUCCESS') {
          finished = true;
          result = res;
        } else if (state === 'FAILURE') {
          throw new Error('Transfer failed on the server.');
        }
      }

      // Handle the result
      const exportData = result;

      const { playlistData, notFoundItems } = handleExportData(exportData);
      setNotFoundItems(notFoundItems);
      setSpotifyPlaylist(playlistData);
      if (playlistData?.length > 0) {
        setDialogTitle('Transfer Successful!');
        setDialogDescription(
          'We found matching Spotify albums for your record collection'
        );
      } else {
        setDialogTitle('Transfer Failed!');
        setDialogDescription('We couldn not find any matching Spotify albums');
      }
      setDialogContent(() => {
        const matchedCount = playlistData?.length || 0;
        const unmatchedCount = notFoundItems?.length || 0;

        if (matchedCount === 0 && unmatchedCount === 0) {
          // Case with no playlist data at all
          return (
            <p className='text-failed flex gap-2'>
              <OctagonAlert className='text-failed' size={24} />
              No albums were selected or found to process.
            </p>
          );
        }

        return (
          <>
            {matchedCount > 0 && (
              <p>
                <strong>{matchedCount}</strong>{' '}
                {matchedCount > 1 ? 'albums were' : 'album was'} added to the
                playlist creator.
              </p>
            )}
            {unmatchedCount > 0 ? (
              <>
                <p className='text-failed flex gap-2'>
                  <OctagonAlert className='text-failed' size={24} />
                  <strong>{unmatchedCount}</strong> album
                  {unmatchedCount > 1 ? 's' : ''} could not be exported.
                </p>
                <p>This usually happens if:</p>
                <ul className='list-disc list-inside ml-4'>
                  <li>Album isn't available in Spotify's catalog, or</li>
                  <li>Names differ too much between Discogs and Spotify.</li>
                </ul>
                <p>
                  These unmatched albums are highlighted in{' '}
                  <span className='text-failed'>red</span> in your Discogs
                  Collection.
                </p>
              </>
            ) : matchedCount > 0 ? (
              <p className='text-spotify-green'>
                All albums in your collection were successfully matched with
                items in the Spotify catalog.
              </p>
            ) : null}
            <p className='mt-2'>
              Please review the matched albums to ensure they're correct. While
              we aim to ensure high accuracy, metadata inconsistencies can lead
              to mismatches.
            </p>
            <p className='mt-2'>
              You can make adjustments to the playlist before finalizing it.
              When you're ready, click <strong>'Create Playlist'</strong>.
            </p>
          </>
        );
      });
      setDialogOpen(true);
    } catch (error: unknown) {
      console.error('Error transferring Discogs items to Spotify:', error);
      toast.error('Transfer Failed', {
        description: `Something went wrong while moving your collection. Please try again.`,
      });
    } finally {
      setExportProgress(0);
      setProgressText('');
      setSpotifyIsLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    try {
      if (spotifyUser.loggedIn) {
        if (spotifyPlaylist) {
          setSpotifySpinnerText('Creating playlist...');
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
          const response = await createSpotifyPlaylist(
            enabledAlbums,
            playlistName
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

  const handleDemoDialogOpen = () => {
    {
      /* Spotify API limit temporary solution while resolving Spotify API quota extensions issues */
    }
    const dialogContent = (
      <>
        {' '}
        <div className='relative pb-[56.69%] h-0 w-full'>
          <iframe
            src='https://www.loom.com/embed/13052ba3d5284f97bd7aa994ac213298?sid=81d83047-d6ce-4b28-a63f-358279e742f4'
            className='absolute top-0 left-0 w-full h-full'
          ></iframe>
        </div>
      </>
    );
    setDialogTitle('Discofy Demo');
    setDialogContent(dialogContent);
    setDialogDescription('Play the video to see how to use Discofy');
    setDialogOpen(true);
  };

  useEffect(() => {
    const initializeUser = async () => {
      await checkSpotifyAuthStatus();

      if (discogsUser.loggedIn) return; // Avoid re-import if already logged in
      const discogsUserStatus = await checkDiscogsAuthStatus();
      if (discogsUserStatus?.authorized) {
        await discogsImportUserFolders();
      }
    };
    initializeUser();
  }, [discogsUser.loggedIn]);

  return (
    <div className='flex flex-col items-center space-y-6 w-full'>
      {/* Spotify API Limit Banner - Temporary solution while resolving Spotify API quota extensions issues */}
      <div className='w-full bg-failed text-font-bright text-center py-2 px-4 rounded mb-2 font-semibold flex flex-col items-center justify-center gap-2'>
        <SiSpotify className='inline text-spotify-green' size={24} />
        <span>
          Due to recent Spotify API changes, we can't offer the full
          functionality right now. We are adapting to the new Spotify limits.
          Thank you for your patience! <br />
          If you would like to use the app, you can still email us at{' '}
          <a className='text-spotify-green' href='mailto:discofy.app@gmail.com'>
            discofy.app@gmail.com
          </a>{' '}
          so we can approve your request.
          <br /> You can check the app's functionality in demo below: <br />
          <ButtonWithTooltip
            variant={'ghost'}
            className='hover:bg-opacity-0 hover:text-spotify-green font-bold'
            onClick={handleDemoDialogOpen}
          >
            See Demo
          </ButtonWithTooltip>
        </span>
      </div>
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
              spinnerText={discogsSpinnerText}
              isLoading={discogsIsLoading}
            >
              {activeFolderId !== null ? (
                <>
                  {discogsFolderItemsCache[activeFolderId]?.map((album, i) => {
                    // Check for singles so they can be flagged
                    const isSingle = album.descriptions?.includes('Single');
                    return (
                      <AlbumItem
                        key={`disc-${album.discogs_id}-${i}`}
                        index={i}
                        title={album.title}
                        artist={album.artists.join(', ')}
                        coverUrl={album.cover}
                        url={album.url}
                        {...(isSingle && { type: 'Single' })}
                        highlight={notFoundItems.some(
                          (item) => item.discogs_id === album.discogs_id
                        )}
                        toggleable={false} // do not allow for toggling discogs items for now
                      />
                    );
                  })}
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
              spotifyIsLoading ||
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
              placeholderText={
                spotifyUser.loggedIn
                  ? 'Import items from Discogs to create a playlist'
                  : 'Connect to Spotify to create a playlist'
              }
              spinnerText={spotifySpinnerText}
              isLoading={spotifyIsLoading}
              loadingProgress={exportProgress}
              progressText={progressText}
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
              disabled={spotifyPlaylist?.length <= 0 || spotifyIsLoading}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <ButtonWithTooltip
              disabled={
                spotifyPlaylist?.length <= 0 ||
                playlistName.length == 0 ||
                spotifyIsLoading
              }
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
