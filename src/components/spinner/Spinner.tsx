type SpinnerProps = {
  text?: string;
  className?: string;
  visible?: boolean;
};

export default function Spinner({
  text = '',
  className = '',
  visible = true,
}: SpinnerProps) {
  if (!visible) return null;

  return (
    <div className={className}>
      <img src='assets/spinner.svg' className='spinner' alt='Loading...' />
      <span>{text}</span>
    </div>
  );
}
