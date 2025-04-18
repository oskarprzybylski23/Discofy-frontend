import React from 'react';
import Spinner from '../spinner/Spinner';
import UserInfo from './UserInfo';

type ListContainerProps = {
  title: string;
  loggedInUser?: { name: string; profileUrl: string };
  children: React.ReactNode;
  isLoading?: boolean;
  spinnerText?: string;
};

export default function ListContainer({
  title,
  loggedInUser,
  children,
  isLoading = false,
  spinnerText = '',
}: ListContainerProps) {
  return (
    <div className='text-font-bright relative'>
      {isLoading && (
        <Spinner text={spinnerText} className='spinner-container' />
      )}

      <div className='text-2xl font-bold text-center'>
        <h2>{title}</h2>
      </div>

      {loggedInUser && (
        <UserInfo name={loggedInUser.name} url={loggedInUser.profileUrl} />
      )}

      <ul className='bg-light-background h-[400px] max-h-[400px] p-0.5 rounded-md overflow-y-scroll'>
        {children}
      </ul>
    </div>
  );
}
