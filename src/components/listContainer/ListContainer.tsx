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
    <div className='text-font-bright relative'>
      {isLoading && (
        <Spinner text={spinnerText} className='spinner-container' />
      )}

      <div className='text-2xl font-bold text-center'>
        <h2>{title}</h2>
      </div>

      <div className='h-[52px]'>
        {loggedInUser.loggedIn && (
          <UserInfo name={loggedInUser.name} url={loggedInUser.profileUrl} />
        )}
      </div>

      <ul
        className={`bg-light-background h-[400px] max-h-[400px] p-0.5 rounded-md overflow-y-scroll ${isLoading ? 'opacity-60 pointer-events-none blur-xs' : ''}`}
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
