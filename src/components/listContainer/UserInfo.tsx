type UserInfoProps = {
  name: string;
  url: string;
};

export default function UserInfo({ name, url }: UserInfoProps) {
  return (
    <p className='text-left text-sm'>
      Connected to user{' '}
      <a
        className='text-spotify-green font-bold hover:brightness-135'
        href={url}
        target='_blank'
        rel='noopener noreferrer'
      >
        {name}
      </a>
    </p>
  );
}
