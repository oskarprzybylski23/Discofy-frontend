import { SpotifyAlbumItem } from '@/types/spotify';

// Handles export data from Spotify transfer response
export function handleExportData(exportData: any) {
  const playlistData: SpotifyAlbumItem[] = [];
  const notFoundItems: SpotifyAlbumItem[] = [];

  for (let i = 0; i < exportData.length; i++) {
    const item = exportData[i];
    if (item.found) {
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
  return { playlistData, notFoundItems };
}

// Helper to open an auth popup and handle messaging/cleanup
export function openAuthPopup(
  authorize_url: string,
  onComplete: () => void,
  onError: (reason: string) => void,
  checkStatus: () => Promise<boolean>
) {
  let importTriggered = false;
  // Add listener before opening popup
  // Trigger completion on receiveing message from backend
  const listener = async (event: MessageEvent) => {
    if (event.data === 'authorizationComplete') {
      popup?.close();
      const isAuthenticated = await checkStatus();

      if (isAuthenticated && !importTriggered) {
        importTriggered = true;
        onComplete();
      }
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
    'Auth Login',
    'width=600,height=700'
  );

  if (!popup) {
    onError('Popup was blocked.');
    cleanup();
    return;
  }

  // Poll popup to detect early close
  const popupCheckInterval = setInterval(async () => {
    console.log('Check interval');
    if (popup.closed) {
      // Check status before deciding in case user successfully logged in but closed popup manually
      try {
        const isAuthenticated = await checkStatus();

        if (isAuthenticated && !importTriggered) {
          importTriggered = true;
          onComplete();
        } else if (!isAuthenticated) {
          onError('Popup closed before auth completed.');
        }
      } catch (e) {
        onError('Popup closed and status check failed.');
      }
      cleanup();
    }
  }, 500);

  return cleanup;
}
