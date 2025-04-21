export interface DiscogsAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface DiscogsCheckAuthResponse {
  authorized: boolean;
}

export interface DiscogsLibraryFolderResponse {
  count: string;
  folder: string;
  index: number;
}

export interface DiscogsUserInfoResponse {
  url: string;
  username: string;
}

export interface DiscogsLibraryResponse {
  library: DiscogsLibraryFolderResponse[];
  user_info: DiscogsUserInfoResponse;
}

export interface User {
  loggedIn: boolean;
  name: string;
  profileUrl: string;
}

export interface DiscogsFolder {
  id: string;
  name: string;
  count: number;
}

export type DiscogsAlbumItem = {
  artist: string;
  cover: string;
  discogs_id: number;
  index: number;
  title: string;
  url: string;
  year: number;
};

export type DiscogsCollectionResponse = DiscogsAlbumItem[];

export interface SpotifyAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface SpotifyAuthCheckResponse {
  authorized: boolean;
  url: string;
  username: string;
}

export type SpotifyAlbumItem = {
  artist: string;
  title: string;
  image: string;
  url: string;
  id: string;
  uri: string;
  discogs_id: string;
  found: boolean;
};

export type SpotifyTransferResponse = SpotifyAlbumItem[];

export type CreatePlaylistResponse = {
  status: 'success' | 'error';
  message: string;
  url: string | null;
};
