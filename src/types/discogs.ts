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

export interface DiscogsUser {
  loggedIn: boolean;
  name: string;
  profileUrl: string;
}

export interface DiscogsFolder {
  id: string;
  name: string;
  count: number;
}
