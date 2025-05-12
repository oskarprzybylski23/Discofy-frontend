export interface User {
  loggedIn: boolean;
  name: string;
  profileUrl: string;
}

export type LogoutResponse = {
  status: 'success' | 'error';
  message: string;
};
