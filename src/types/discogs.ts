export interface DiscogsAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface DiscogsCheckAuthResponse {
  authorized: boolean;
  username: string;
  id: number;
  url: string;
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
  folders: DiscogsLibraryFolderResponse[];
}

export interface DiscogsFolder {
  id: string;
  name: string;
  count: number;
}

export type DiscogsAlbumItem = {
  index: number;
  artists: string[];
  title: string;
  year: number;
  discogs_id: number;
  cover: string;
  format: string;
  descriptions: string[];
  url: string;
  disabled?: boolean;
};

export type DiscogsCollectionResponse = DiscogsAlbumItem[];
