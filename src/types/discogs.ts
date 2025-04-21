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
