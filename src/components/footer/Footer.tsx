export default function Footer() {
  return (
    <footer className='w-full gap-2 flex justify-center items-center h-9 text-sm bg-background'>
      <div>
        <span className='text-font-bright flex items-center gap-2'>
          Created by
          <a
            className='footer-link text-spotify-green hover:text-spotify-green-highlight font-bold flex gap-2 align-middle m-0 no-underline'
            href='//github.com/oskarprzybylski23'
            target='_blank'
          >
            <img
              className='icon h-4 align-middle invert-100'
              src='gitHub_icon.svg'
              alt='GitHub Icon'
            />
            Oskar Przybylski
          </a>
          (2024)
        </span>
      </div>
      <a
        className='footer-link text-spotify-green hover:text-spotify-green-highlight font-bold flex gap-2 align-middle m-0 no-underline'
        target='_blank'
        href='https://www.loom.com/share/e11a4cab0b6f43749151b7ffd11d150b'
      >
        <p>·</p>
        <p>How to Use</p>
        <p>·</p>
      </a>
    </footer>
  );
}
