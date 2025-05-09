import React from 'react';
import Spinner from '../spinner/Spinner';
import UserInfo from './UserInfo';

type ListContainerProps = {
  title: string;
  loggedInUser: { loggedIn: boolean; name: string; profileUrl: string };
  placeholderText?: string;
  isLoading?: boolean;
  spinnerText?: string;
  children: React.ReactNode;
};

export default function ListContainer({
  title,
  loggedInUser,
  placeholderText = '',
  isLoading = false,
  spinnerText = '',
  children,
}: ListContainerProps) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className='text-font-bright flex flex-col h-full relative'>
      {isLoading && (
        <Spinner text={spinnerText} className='spinner-container' />
      )}

      <div className='text-2xl font-bold text-center mb-4'>
        <h2>{title}</h2>
      </div>

      <div className='min-h-6 mb-4'>
        {loggedInUser.loggedIn && (
          <UserInfo name={loggedInUser.name} url={loggedInUser.profileUrl} />
        )}
      </div>

      <ul
        className={`bg-light-background flex-1 p-0.5 rounded-md overflow-y-auto ${isLoading ? 'opacity-60 pointer-events-none blur-xs' : ''}`}
      >
        {hasChildren ? (
          children
        ) : (
          <li className='flex h-full items-center justify-center text-center text-base font-bold text-font-mid py-4'>
            {placeholderText}
          </li>
        )}
      </ul>
    </div>
  );
}
