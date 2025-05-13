import spinnerSvg from '../../assets/spinner.svg';

type SpinnerProps = {
  text?: string;
  progress?: number;
  className?: string;
  visible?: boolean;
};

export default function Spinner({ text = '', visible = true }: SpinnerProps) {
  if (!visible) return null;

  return (
    <div className='text-center flex flex-col justify-'>
      <img src={spinnerSvg} className='h-[50px]' alt='Loading...' />
      {text && (
        <span className='text-spotify-green mb-2 rounded-md'>{text}</span>
      )}
    </div>
  );
}
