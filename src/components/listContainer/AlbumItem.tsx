type AlbumItemProps = {
  index: number;
  title: string;
  artist: string;
  coverUrl: string;
};

export default function AlbumItem({
  index,
  title,
  artist,
  coverUrl,
}: AlbumItemProps) {
  return (
    <li>
      <div className='bg-mid-background text-base flex items-center gap-2 mt-0.5 p-2 min-h-10 rounded-md hover:brightness-135'>
        <span className='text-font-mid text-sm flex justify-center items-center w-8'>
          {index + 1}
        </span>
        <img className='h-[40px]]' src={coverUrl} alt='Album Cover' />
        <div className='flex flex-col w-[70%]'>
          <span className='overflow-y-hidden font-medium'>{title}</span>
          <span className='text-font-mid text-sm'>{artist}</span>
        </div>
      </div>
    </li>
  );
}
