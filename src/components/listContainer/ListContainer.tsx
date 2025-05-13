import React from 'react';
import Spinner from '../spinner/Spinner';
import UserInfo from './UserInfo';
import { Progress } from '../ui/progress';

type ListContainerProps = {
  title: string;
  loggedInUser: { loggedIn: boolean; name: string; profileUrl: string };
  placeholderText?: string;
  isLoading?: boolean;
  loadingProgress?: number;
  progressText?: string;
  spinnerText?: string;
  children: React.ReactNode;
};

export default function ListContainer({
  title,
  loggedInUser,
  placeholderText = '',
  isLoading = false,
  loadingProgress = 0,
  progressText,
  spinnerText = '',
  children,
}: ListContainerProps) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className='text-font-bright flex flex-col h-full relative'>
      {/* Container Title */}
      <div className='text-2xl font-bold text-center mb-4'>
        <h2>{title}</h2>
      </div>
      {/* Logged in user info */}
      <div className='min-h-6 mb-4'>
        {loggedInUser.loggedIn && (
          <UserInfo name={loggedInUser.name} url={loggedInUser.profileUrl} />
        )}
      </div>
      {/* Album list */}
      <ul
        className={`bg-light-background opacity-80 flex-1 p-0.5 flex flex-col gap-0.5 rounded-md overflow-y-auto ${isLoading ? 'opacity-60 pointer-events-none blur-xs' : ''}`}
      >
        {hasChildren ? (
          children
        ) : (
          <li className='flex h-full items-center justify-center text-center text-base font-bold text-font-mid py-4'>
            {placeholderText}
          </li>
        )}
      </ul>
      {/* Spinner and progress indicators */}
      <div className='absolute w-2/3 flex flex-col left-1/2 translate-x-[-50%] top-1/2 z-50'>
        {isLoading && (
          <Spinner
            text={spinnerText}
            progress={loadingProgress}
            className='spinner-container'
          />
        )}
        {loadingProgress > 0 ? (
          <Progress className='mb-2' value={loadingProgress} />
        ) : null}
        {progressText && <p className='text-center'>{progressText}</p>}
      </div>
    </div>
  );
}
