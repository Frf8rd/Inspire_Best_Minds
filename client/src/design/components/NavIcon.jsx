export default function NavIcon({ name }) {
  return (
    <svg
      className="nav-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'home' && (
        <>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9M9 20v-7h6v7" />
        </>
      )}
      {name === 'map' && (
        <>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <path d="M9 3v15M15 6v15" />
        </>
      )}
      {name === 'report' && <path d="M12 5v14M5 12h14" />}
      {name === 'problems' && (
        <>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </>
      )}
      {name === 'my-problems' && (
        <>
          <path d="M4 4h16v16H4z" />
          <path d="m8 12 2.5 2.5L16 9" />
        </>
      )}
      {name === 'notifications' && (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </>
      )}
      {name === 'staff' && (
        <>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
          <path d="M9 9h.01M15 9h.01" />
        </>
      )}
      {name === 'admin' && (
        <>
          <path d="M12 3 20 7v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {name === 'profile' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
      {name === 'logout' && (
        <>
          <path d="M10 17l5-5-5-5M15 12H3" />
          <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </>
      )}
    </svg>
  );
}
