type FolderItemProps = {
  index: number;
  name: string;
  count: number;
  onClick?: () => void;
};

export default function FolderItem({
  index,
  name,
  count,
  onClick,
}: FolderItemProps) {
  return (
    <li onClick={onClick}>
      <div className='bg-mid-background text-base flex items-center gap-2 mt-0.5 p-2 min-h-10 rounded-md hover:brightness-135 cursor-pointer'>
        <span className='text-font-mid text-sm flex justify-center items-center w-8'>
          {index + 1}
        </span>
        <div className='flex flex-col w-[70%]'>
          <span className='overflow-y-hidden font-medium'>{name}</span>
          <span className='text-font-mid text-sm'>{`${count} records`}</span>
        </div>
      </div>
    </li>
  );
}
