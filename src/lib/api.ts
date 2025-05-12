import axios from 'axios';
import {
  DiscogsAuthorizeResponse,
  DiscogsCheckAuthResponse,
  DiscogsLibraryResponse,
  DiscogsCollectionResponse,
  DiscogsAlbumItem,
} from '../types/discogs';
import {
  SpotifyAuthorizeResponse,
  SpotifyAuthCheckResponse,
  SpotifyTransferResponse,
  CreatePlaylistResponse,
  SpotifyAlbumItem,
} from '@/types/spotify';
import { LogoutResponse } from '@/types/shared';

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Discogs API
export async function getDiscogsAuthUrl() {
  return apiClient.post<DiscogsAuthorizeResponse>(
    'discogs/get_auth_url',
    null,
    { withCredentials: true }
  );
}

export async function checkDiscogsAuthStatus() {
  return apiClient.get<DiscogsCheckAuthResponse>(
    'discogs/check_authorization',
    { withCredentials: true }
  );
}

export async function getDiscogsLibrary() {
  return apiClient.get<DiscogsLibraryResponse>('discogs/get_library', {
    withCredentials: true,
  });
}

export async function getDiscogsFolderContents(folderId: number) {
  return apiClient.get<DiscogsCollectionResponse>(
    'discogs/get_folder_contents',
    { params: { folder: folderId } }
  );
}

export async function discogsLogout() {
  return apiClient.post<LogoutResponse>('discogs/logout', {
    withCredentials: true,
  });
}

// Spotify API
export async function getSpotifyAuthUrl() {
  return apiClient.get<SpotifyAuthorizeResponse>('spotify/get_auth_url');
}

export async function checkSpotifyAuthStatus() {
  return apiClient.get<SpotifyAuthCheckResponse>(
    'spotify/check_authorization',
    { withCredentials: true }
  );
}

export async function spotifyLogout() {
  return apiClient.post<LogoutResponse>('spotify/logout', {
    withCredentials: true,
  });
}

export async function transferCollectionToSpotify(collection: DiscogsAlbumItem[]) {
  return apiClient.post<SpotifyTransferResponse>(
    'spotify/transfer_collection',
    { collection },
    { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function createSpotifyPlaylist(
  playlist: SpotifyAlbumItem[],
  playlistName: string
) {
  return apiClient.post<CreatePlaylistResponse>(
    'spotify/create_playlist',
    { playlist, playlist_name: playlistName },
    { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
  );
}
