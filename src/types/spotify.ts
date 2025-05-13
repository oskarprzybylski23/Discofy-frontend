export type SpotifyAlbumItem = {
  artist: string;
  title: string;
  image: string;
  url: string;
  id: string;
  uri: string;
  discogs_id: number;
  found: boolean;
  disabled?: boolean;
};

export interface SpotifyAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface SpotifyAuthCheckResponse {
  authorized: boolean;
  url: string;
  username: string;
}

export type SpotifyTransferResponse = {
  task_id: 'string';
  progress_key: 'string';
};

export type TransferCollectionStatusResponse = {
  state: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | string;
  progress: {
    current: number;
    total: number;
    finished?: boolean;
  };
  result: SpotifyAlbumItem[];
};

export type CreatePlaylistResponse = {
  status: 'success' | 'error';
  message: string;
  url: string | null;
};
