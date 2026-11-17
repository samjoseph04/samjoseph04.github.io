import BrandMark from './BrandMark';
/** The user's supplied SJ-and-dot mark, faithfully traced into a scalable SVG. */
export default function Brand({ name }: { name: string }) {
  return (
    <a className="wordmark" href="#home" aria-label={`${name}, home`}>
      <BrandMark />
      <span className="wordmark-caption">
        <span className="wordmark-name">SAM JOSEPH</span>
      </span>
    </a>
  );
}
