export default function Logo({ size = 36 }) {
  return (
    <span className="logo" style={{ width: size, height: size }}>
      <svg width={size * 0.47} height={size * 0.47} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h6" /><path d="M9 14h5" /><path d="M9 17.5h3" />
      </svg>
    </span>
  );
}
