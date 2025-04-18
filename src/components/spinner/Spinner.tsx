type SpinnerProps = {
  text?: string;
  className?: string;
  visible?: boolean;
};

export default function Spinner({ text = '', visible = true }: SpinnerProps) {
  if (!visible) return null;

  return (
    <div className='text-center absolute flex flex-col left-1/2 translate-x-[-50%] top-1/2'>
      <img
        src='src/assets/spinner.svg'
        className='h-[50px] mb-2.5'
        alt='Loading...'
      />
      <span className='text-spotify-green bg-light-background p-2 rounded-md'>
        {text}
      </span>
    </div>
  );
}
