import spinnerSvg from '../../assets/spinner.svg';

type SpinnerProps = {
  text?: string;
  className?: string;
  visible?: boolean;
};

export default function Spinner({ text = '', visible = true }: SpinnerProps) {
  if (!visible) return null;

  return (
    <div className='text-center absolute flex flex-col left-1/2 translate-x-[-50%] top-1/2 z-50'>
      <img src={spinnerSvg} className='h-[50px] mb-2.5' alt='Loading...' />
      {text && (
        <span className='text-spotify-green p-2 rounded-md shadow-lg '>
          {text}
        </span>
      )}
    </div>
  );
}
