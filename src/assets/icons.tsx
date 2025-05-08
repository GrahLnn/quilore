interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const logos = {
  tauri({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        width="206"
        height="231"
        viewBox="0 0 206 231"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M143.143 84C143.143 96.1503 133.293 106 121.143 106C108.992 106 99.1426 96.1503 99.1426 84C99.1426 71.8497 108.992 62 121.143 62C133.293 62 143.143 71.8497 143.143 84Z"
          fill={color || "currentColor"}
        />
        <ellipse
          cx="84.1426"
          cy="147"
          rx="22"
          ry="22"
          transform="rotate(180 84.1426 147)"
          fill="#24C8DB"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M166.738 154.548C157.86 160.286 148.023 164.269 137.757 166.341C139.858 160.282 141 153.774 141 147C141 144.543 140.85 142.121 140.558 139.743C144.975 138.204 149.215 136.139 153.183 133.575C162.73 127.404 170.292 118.608 174.961 108.244C179.63 97.8797 181.207 86.3876 179.502 75.1487C177.798 63.9098 172.884 53.4021 165.352 44.8883C157.82 36.3744 147.99 30.2165 137.042 27.1546C126.095 24.0926 114.496 24.2568 103.64 27.6274C92.7839 30.998 83.1319 37.4317 75.8437 46.1553C74.9102 47.2727 74.0206 48.4216 73.176 49.5993C61.9292 50.8488 51.0363 54.0318 40.9629 58.9556C44.2417 48.4586 49.5653 38.6591 56.679 30.1442C67.0505 17.7298 80.7861 8.57426 96.2354 3.77762C111.685 -1.01901 128.19 -1.25267 143.769 3.10474C159.348 7.46215 173.337 16.2252 184.056 28.3411C194.775 40.457 201.767 55.4101 204.193 71.404C206.619 87.3978 204.374 103.752 197.73 118.501C191.086 133.25 180.324 145.767 166.738 154.548ZM41.9631 74.275L62.5557 76.8042C63.0459 72.813 63.9401 68.9018 65.2138 65.1274C57.0465 67.0016 49.2088 70.087 41.9631 74.275Z"
          fill={color || "currentColor"}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M38.4045 76.4519C47.3493 70.6709 57.2677 66.6712 67.6171 64.6132C65.2774 70.9669 64 77.8343 64 85.0001C64 87.1434 64.1143 89.26 64.3371 91.3442C60.0093 92.8732 55.8533 94.9092 51.9599 97.4256C42.4128 103.596 34.8505 112.392 30.1816 122.756C25.5126 133.12 23.9357 144.612 25.6403 155.851C27.3449 167.09 32.2584 177.598 39.7906 186.112C47.3227 194.626 57.153 200.784 68.1003 203.846C79.0476 206.907 90.6462 206.743 101.502 203.373C112.359 200.002 122.011 193.568 129.299 184.845C130.237 183.722 131.131 182.567 131.979 181.383C143.235 180.114 154.132 176.91 164.205 171.962C160.929 182.49 155.596 192.319 148.464 200.856C138.092 213.27 124.357 222.426 108.907 227.222C93.458 232.019 76.9524 232.253 61.3736 227.895C45.7948 223.538 31.8055 214.775 21.0867 202.659C10.3679 190.543 3.37557 175.59 0.949823 159.596C-1.47592 143.602 0.768139 127.248 7.41237 112.499C14.0566 97.7497 24.8183 85.2327 38.4045 76.4519ZM163.062 156.711L163.062 156.711C162.954 156.773 162.846 156.835 162.738 156.897C162.846 156.835 162.954 156.773 163.062 156.711Z"
          fill={color || "currentColor"}
        />
      </svg>
    );
  },
};

export const icons = {
  minus({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="3.25" y1="9" x2="14.75" y2="9" />
        </g>
      </svg>
    );
  },
  square({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <rect x="2.75" y="2.75" width="12.5" height="12.5" rx="2" ry="2" />
        </g>
      </svg>
    );
  },
  stacksquare({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <rect x="2.75" y="4.75" width="10" height="10" rx="2" ry="2" />
          <path
            d="M15.25 11.25v-5a4 4 0 0 0-4-4h-5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    );
  },
  xmark({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="14" y1="4" x2="4" y2="14" />
          <line x1="4" y1="4" x2="14" y2="14" />
        </g>
      </svg>
    );
  },
  pin({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path
            d="M10.371 15.553C10.803 14.996 11.391 14.083 11.719 12.835C11.888 12.193 11.949 11.611 11.962 11.134L14.967 8.129C15.748 7.348 15.748 6.082 14.967 5.301L12.699 3.033C11.918 2.252 10.652 2.252 9.87101 3.033L6.86601 6.038C6.38801 6.051 5.80701 6.112 5.16501 6.281C3.91701 6.609 3.00401 7.197 2.44701 7.629L10.372 15.554L10.371 15.553Z"
            fill={color || "currentColor"}
            fillOpacity="0.3"
            data-stroke="none"
            stroke="none"
          />
          <path d="M3.08099 14.919L6.40899 11.591" />
          <path d="M10.371 15.553C10.803 14.996 11.391 14.083 11.719 12.835C11.888 12.193 11.949 11.611 11.962 11.134L14.967 8.129C15.748 7.348 15.748 6.082 14.967 5.301L12.699 3.033C11.918 2.252 10.652 2.252 9.87101 3.033L6.86601 6.038C6.38801 6.051 5.80701 6.112 5.16501 6.281C3.91701 6.609 3.00401 7.197 2.44701 7.629L10.372 15.554L10.371 15.553Z" />
        </g>
      </svg>
    );
  },
  lang({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path d="M2.25 4.25H10.25" /> <path d="M6.25 2.25V4.25" />
          <path d="M4.25 4.25C4.341 6.926 6.166 9.231 8.75 9.934" />
          <path d="M8.25 4.25C7.85 9.875 2.25 10.25 2.25 10.25" />
          <path d="M9.25 15.75L12.25 7.75H12.75L15.75 15.75" />
          <path d="M10.188 13.25H14.813" />
        </g>
      </svg>
    );
  },
  sliders({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="13.25" y1="5.25" x2="16.25" y2="5.25" />
          <line x1="1.75" y1="5.25" x2="8.75" y2="5.25" />
          <circle cx="11" cy="5.25" r="2.25" />
          <line x1="4.75" y1="12.75" x2="1.75" y2="12.75" />
          <line x1="16.25" y1="12.75" x2="9.25" y2="12.75" />
          <circle cx="7" cy="12.75" r="2.25" />
        </g>
      </svg>
    );
  },
  sliders2({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="15.25" y1="9" x2="16.25" y2="9" />
          <line x1="1.75" y1="9" x2="9" y2="9" />
          <line x1="5" y1="3.75" x2="1.75" y2="3.75" />
          <line x1="16.25" y1="3.75" x2="11.25" y2="3.75" />
          <line x1="5" y1="14.25" x2="1.75" y2="14.25" />
          <line x1="16.25" y1="14.25" x2="11.25" y2="14.25" />
          <circle cx="11" cy="9" r="1.75" />
          <circle cx="6.75" cy="3.75" r="1.75" />
          <circle cx="6.75" cy="14.25" r="1.75" />
        </g>
      </svg>
    );
  },
  barsFilter({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="5.25" y1="9" x2="12.75" y2="9" />
          <line x1="2.75" y1="4.25" x2="15.25" y2="4.25" />
          <line x1="8" y1="13.75" x2="10" y2="13.75" />
        </g>
      </svg>
    );
  },
  globe3({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <ellipse cx="9" cy="9" rx="3" ry="7.25" />
          <line x1="2.106" y1="6.75" x2="15.894" y2="6.75" />
          <line x1="2.29" y1="11.75" x2="15.71" y2="11.75" />
          <circle cx="9" cy="9" r="7.25" />
        </g>
      </svg>
    );
  },
  cloudRefresh({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path d="M14.24,13.823c1.195-.627,2.01-1.88,2.01-3.323,0-1.736-1.185-3.182-2.786-3.609-.186-2.314-2.102-4.141-4.464-4.141-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.306,.835,2.417,2,2.829" />
          <polyline points="9.25 13.75 11.75 13.75 11.75 11.25" />
          <path d="M11,16.387c-.501,.531-1.212,.863-2,.863-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c1.166,0,2.162,.726,2.563,1.75" />
        </g>
      </svg>
    );
  },
  magnifler3({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="15.25" y1="15.25" x2="11.285" y2="11.285" />
          <circle cx="7.75" cy="7.75" r="5" />
          <path d="M7.75,5.25c1.381,0,2.5,1.119,2.5,2.5" />
        </g>
      </svg>
    );
  },
  menuBars({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="5.75" y1="9" x2="16.25" y2="9" />
          <line x1="1.75" y1="9" x2="2.75" y2="9" />
          <line x1="15.25" y1="3.75" x2="16.25" y2="3.75" />
          <line x1="1.75" y1="3.75" x2="12.25" y2="3.75" />
          <line x1="15.25" y1="14.25" x2="16.25" y2="14.25" />
          <line x1="1.75" y1="14.25" x2="12.25" y2="14.25" />
        </g>
      </svg>
    );
  },
  tableCols2({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="9" y1="2.75" x2="9" y2="15.25" />
          <rect x="2.75" y="2.75" width="12.5" height="12.5" rx="2" ry="2" />
        </g>
      </svg>
    );
  },
  gridCircle({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <circle cx="5" cy="5" r="2.5" />
          <circle cx="13" cy="5" r="2.5" />
          <circle cx="5" cy="13" r="2.5" />
          <circle cx="13" cy="13" r="2.5" />
        </g>
      </svg>
    );
  },
  arrowDown({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="9" y1="15.25" x2="9" y2="2.75" />
          <polyline points="13.25 11 9 15.25 4.75 11" />
        </g>
      </svg>
    );
  },
  duplicate2({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path
            d="M3.75 12.75L10.75 12.75C11.8546 12.75 12.75 11.8546 12.75 10.75L12.75 3.75C12.75 2.64543 11.8546 1.75 10.75 1.75L3.75 1.75C2.64543 1.75 1.75 2.64543 1.75 3.75L1.75 10.75C1.75 11.8546 2.64543 12.75 3.75 12.75Z"
            fill="#212121"
            fillOpacity="0.3"
            data-stroke="none"
            stroke={color || "currentColor"}
          />
          <path d="M3.75 12.75L10.75 12.75C11.8546 12.75 12.75 11.8546 12.75 10.75L12.75 3.75C12.75 2.64543 11.8546 1.75 10.75 1.75L3.75 1.75C2.64543 1.75 1.75 2.64543 1.75 3.75L1.75 10.75C1.75 11.8546 2.64543 12.75 3.75 12.75Z" />
          <path d="M15.199 6.002L16.228 12.926C16.39 14.019 15.636 15.036 14.544 15.198L7.61998 16.227C6.68698 16.366 5.80998 15.837 5.47198 14.999" />
        </g>
      </svg>
    );
  },
  dotsVertical({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M9.00009 10.25C9.69045 10.25 10.2501 9.69036 10.2501 9C10.2501 8.30964 9.69045 7.75 9.00009 7.75C8.30974 7.75 7.75009 8.30964 7.75009 9C7.75009 9.69036 8.30974 10.25 9.00009 10.25Z"
          />
          <path d="M9.00009 4.5C9.69045 4.5 10.2501 3.94036 10.2501 3.25C10.2501 2.55964 9.69045 2 9.00009 2C8.30974 2 7.75009 2.55964 7.75009 3.25C7.75009 3.94036 8.30974 4.5 9.00009 4.5Z" />
          <path d="M9.00009 16C9.69045 16 10.2501 15.4404 10.2501 14.75C10.2501 14.0596 9.69045 13.5 9.00009 13.5C8.30974 13.5 7.75009 14.0596 7.75009 14.75C7.75009 15.4404 8.30974 16 9.00009 16Z" />
        </g>
      </svg>
    );
  },
  dots({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M9.00009 10.25C9.69045 10.25 10.2501 9.69036 10.2501 9C10.2501 8.30964 9.69045 7.75 9.00009 7.75C8.30974 7.75 7.75009 8.30964 7.75009 9C7.75009 9.69036 8.30974 10.25 9.00009 10.25Z"
          />
          <path d="M3.25009 10.25C3.94045 10.25 4.50009 9.69036 4.50009 9C4.50009 8.30964 3.94045 7.75 3.25009 7.75C2.55974 7.75 2.00009 8.30964 2.00009 9C2.00009 9.69036 2.55974 10.25 3.25009 10.25Z" />
          <path d="M14.7501 10.25C15.4404 10.25 16.0001 9.69036 16.0001 9C16.0001 8.30964 15.4404 7.75 14.7501 7.75C14.0597 7.75 13.5001 8.30964 13.5001 9C13.5001 9.69036 14.0597 10.25 14.7501 10.25Z" />
        </g>
      </svg>
    );
  },
  shareUpRight2({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="5.268" y1="6.732" x2="11.073" y2=".927" />
          <polyline points="11.25 4.5 11.25 .75 7.5 .75" />
          <path d="m9.25,6.285v2.465c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2v-4c0-1.105.895-2,2-2h2.465" />
        </g>
      </svg>
    );
  },
  fullScreen4({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M2.75 7.5C3.164 7.5 3.5 7.164 3.5 6.75V4.75C3.5 4.061 4.061 3.5 4.75 3.5H6.75C7.164 3.5 7.5 3.164 7.5 2.75C7.5 2.336 7.164 2 6.75 2H4.75C3.233 2 2 3.233 2 4.75V6.75C2 7.164 2.336 7.5 2.75 7.5Z"
          />
          <path
            opacity="0.4"
            d="M13.25 2H11.25C10.836 2 10.5 2.336 10.5 2.75C10.5 3.164 10.836 3.5 11.25 3.5H13.25C13.939 3.5 14.5 4.061 14.5 4.75V6.75C14.5 7.164 14.836 7.5 15.25 7.5C15.664 7.5 16 7.164 16 6.75V4.75C16 3.233 14.767 2 13.25 2Z"
          />
          <path
            opacity="0.4"
            d="M15.25 10.5C14.836 10.5 14.5 10.836 14.5 11.25V13.25C14.5 13.939 13.939 14.5 13.25 14.5H11.25C10.836 14.5 10.5 14.836 10.5 15.25C10.5 15.664 10.836 16 11.25 16H13.25C14.767 16 16 14.767 16 13.25V11.25C16 10.836 15.664 10.5 15.25 10.5Z"
          />
          <path
            opacity="0.4"
            d="M6.75 14.5H4.75C4.061 14.5 3.5 13.939 3.5 13.25V11.25C3.5 10.836 3.164 10.5 2.75 10.5C2.336 10.5 2 10.836 2 11.25V13.25C2 14.767 3.233 16 4.75 16H6.75C7.164 16 7.5 15.664 7.5 15.25C7.5 14.836 7.164 14.5 6.75 14.5Z"
          />
          <path d="M11.25 6H6.75C6.33579 6 6 6.33579 6 6.75V11.25C6 11.6642 6.33579 12 6.75 12H11.25C11.6642 12 12 11.6642 12 11.25V6.75C12 6.33579 11.6642 6 11.25 6Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzIxMjEyMSI+PHBhdGggZD0iTTkgMy4yNVYxNC43NSI+PC9wYXRoPjxwYXRoIGQ9Ik0zLjI1IDlIMTQuNzUiPjwvcGF0aD48L2c+PC9zdmc+)
   * @returns
   */
  plus({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path d="M9 3.25V14.75" /> <path d="M3.25 9H14.75" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzIxMjEyMSI+PHBhdGggZD0iTTIuMjUsNy43NXYtM2MwLTEuMTA1LC44OTUtMiwyLTJoMS45NTFjLjYwNywwLDEuMTgsLjI3NSwxLjU2LC43NDhsLjYwMywuNzUyaDUuMzg2YzEuMTA1LDAsMiwuODk1LDIsMnYxLjUiPjwvcGF0aD48cGF0aCBkPSJNMi43MDIsNy43NUgxNS4yOThjLjk4NiwwLDEuNzAzLC45MzQsMS40NDksMS44ODZsLTEuMTAxLDQuMTI5Yy0uMjMzLC44NzYtMS4wMjYsMS40ODUtMS45MzIsMS40ODVINC4yODdjLS45MDYsMC0xLjY5OS0uNjA5LTEuOTMyLTEuNDg1bC0xLjEwMS00LjEyOWMtLjI1NC0uOTUyLC40NjQtMS44ODYsMS40NDktMS44ODZaIj48L3BhdGg+PC9nPjwvc3ZnPg==)
   * @returns
   */
  folderOpen({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path d="M2.25,7.75v-3c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v1.5" />
          <path d="M2.702,7.75H15.298c.986,0,1.703,.934,1.449,1.886l-1.101,4.129c-.233,.876-1.026,1.485-1.932,1.485H4.287c-.906,0-1.699-.609-1.932-1.485l-1.101-4.129c-.254-.952,.464-1.886,1.449-1.886Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIG9wYWNpdHk9IjAuNCIgZD0iTTIuNzUgNS4wMDAwMkg1LjkzOUw0Ljk2ODk5IDUuOTY5OTlDNC42NzU5OSA2LjI2Mjk5IDQuNjc1OTkgNi43MzgwMyA0Ljk2ODk5IDcuMDMxMDNDNS4xMTQ5OSA3LjE3NzAzIDUuMzA2OTkgNy4yNTEgNS40OTg5OSA3LjI1MUM1LjY5MDk5IDcuMjUxIDUuODgyOTkgNy4xNzgwMyA2LjAyODk5IDcuMDMxMDNMOC4yNzg5OSA0Ljc4MTAzQzguNTcxOTkgNC40ODgwMyA4LjU3MTk5IDQuMDEyOTkgOC4yNzg5OSAzLjcxOTk5TDYuMDMgMS40Njk5OUM1LjczNyAxLjE3Njk5IDUuMjYxOTkgMS4xNzY5OSA0Ljk2ODk5IDEuNDY5OTlDNC42NzU5OSAxLjc2Mjk5IDQuNjc1OTkgMi4yMzgwMyA0Ljk2ODk5IDIuNTMxMDNMNS45MzkgMy41MDFIMi43NUMyLjMzNiAzLjUwMSAyIDMuODM3IDIgNC4yNTFDMiA0LjY2NSAyLjMzNiA1LjAwMDAyIDIuNzUgNS4wMDAwMloiPjwvcGF0aD48cGF0aCBvcGFjaXR5PSIwLjQiIGQ9Ik05LjAzIDEwLjk3QzguNzM3IDEwLjY3NyA4LjI2MTk5IDEwLjY3NyA3Ljk2ODk5IDEwLjk3QzcuNjc1OTkgMTEuMjYzIDcuNjc1OTkgMTEuNzM4IDcuOTY4OTkgMTIuMDMxTDguOTM5IDEzLjAwMUgyLjc1QzIuMzM2IDEzLjAwMSAyIDEzLjMzNyAyIDEzLjc1MUMyIDE0LjE2NSAyLjMzNiAxNC41MDEgMi43NSAxNC41MDFIOC45MzlMNy45Njg5OSAxNS40NzFDNy42NzU5OSAxNS43NjQgNy42NzU5OSAxNi4yMzkgNy45Njg5OSAxNi41MzJDOC4xMTQ5OSAxNi42NzggOC4zMDY5OSAxNi43NTIgOC40OTg5OSAxNi43NTJDOC42OTA5OSAxNi43NTIgOC44ODI5OSAxNi42NzkgOS4wMjg5OSAxNi41MzJMMTEuMjc5IDE0LjI4MkMxMS41NzIgMTMuOTg5IDExLjU3MiAxMy41MTQgMTEuMjc5IDEzLjIyMUw5LjAyODk5IDEwLjk3MUw5LjAzIDEwLjk3WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNS43OCA4LjQ2OTk5TDEzLjUzIDYuMjE5OTlDMTMuMjM3IDUuOTI2OTkgMTIuNzYyIDUuOTI2OTkgMTIuNDY5IDYuMjE5OTlDMTIuMTc2IDYuNTEyOTkgMTIuMTc2IDYuOTg4MDMgMTIuNDY5IDcuMjgxMDNMMTMuNDM5IDguMjUxSDIuNzVDMi4zMzYgOC4yNTEgMiA4LjU4NyAyIDkuMDAxQzIgOS40MTUgMi4zMzYgOS43NTEgMi43NSA5Ljc1MUgxMy40MzlMMTIuNDY5IDEwLjcyMUMxMi4xNzYgMTEuMDE0IDEyLjE3NiAxMS40ODkgMTIuNDY5IDExLjc4MkMxMi42MTUgMTEuOTI4IDEyLjgwNyAxMi4wMDIgMTIuOTk5IDEyLjAwMkMxMy4xOTEgMTIuMDAyIDEzLjM4MyAxMS45MjkgMTMuNTI5IDExLjc4MkwxNS43NzkgOS41MzIwMUMxNi4wNzIgOS4yMzkwMSAxNi4wNzIgOC43NjM5NyAxNS43NzkgOC40NzA5N0wxNS43OCA4LjQ2OTk5WiI+PC9wYXRoPjwvZz48L3N2Zz4=)
   * @returns
   */
  threeArrowRight({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M2.75 5.00002H5.939L4.96899 5.96999C4.67599 6.26299 4.67599 6.73803 4.96899 7.03103C5.11499 7.17703 5.30699 7.251 5.49899 7.251C5.69099 7.251 5.88299 7.17803 6.02899 7.03103L8.27899 4.78103C8.57199 4.48803 8.57199 4.01299 8.27899 3.71999L6.03 1.46999C5.737 1.17699 5.26199 1.17699 4.96899 1.46999C4.67599 1.76299 4.67599 2.23803 4.96899 2.53103L5.939 3.501H2.75C2.336 3.501 2 3.837 2 4.251C2 4.665 2.336 5.00002 2.75 5.00002Z"
          />
          <path
            opacity="0.4"
            d="M9.03 10.97C8.737 10.677 8.26199 10.677 7.96899 10.97C7.67599 11.263 7.67599 11.738 7.96899 12.031L8.939 13.001H2.75C2.336 13.001 2 13.337 2 13.751C2 14.165 2.336 14.501 2.75 14.501H8.939L7.96899 15.471C7.67599 15.764 7.67599 16.239 7.96899 16.532C8.11499 16.678 8.30699 16.752 8.49899 16.752C8.69099 16.752 8.88299 16.679 9.02899 16.532L11.279 14.282C11.572 13.989 11.572 13.514 11.279 13.221L9.02899 10.971L9.03 10.97Z"
          />
          <path d="M15.78 8.46999L13.53 6.21999C13.237 5.92699 12.762 5.92699 12.469 6.21999C12.176 6.51299 12.176 6.98803 12.469 7.28103L13.439 8.251H2.75C2.336 8.251 2 8.587 2 9.001C2 9.415 2.336 9.751 2.75 9.751H13.439L12.469 10.721C12.176 11.014 12.176 11.489 12.469 11.782C12.615 11.928 12.807 12.002 12.999 12.002C13.191 12.002 13.383 11.929 13.529 11.782L15.779 9.53201C16.072 9.23901 16.072 8.76397 15.779 8.47097L15.78 8.46999Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIG9wYWNpdHk9IjAuNCIgZD0iTTE1IDkuNzVIMi43NUMyLjMzNiA5Ljc1IDIgOS40MTQgMiA5QzIgOC41ODYgMi4zMzYgOC4yNSAyLjc1IDguMjVIMTVDMTUuNDE0IDguMjUgMTUuNzUgOC41ODYgMTUuNzUgOUMxNS43NSA5LjQxNCAxNS40MTQgOS43NSAxNSA5Ljc1WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xMSAxNEMxMC44MDggMTQgMTAuNjE2IDEzLjkyNyAxMC40NyAxMy43OEMxMC4xNzcgMTMuNDg3IDEwLjE3NyAxMy4wMTIgMTAuNDcgMTIuNzE5TDE0LjE5IDguOTk4OTlMMTAuNDcgNS4yNzlDMTAuMTc3IDQuOTg2IDEwLjE3NyA0LjUxMSAxMC40NyA0LjIxOEMxMC43NjMgMy45MjUgMTEuMjM4IDMuOTI1IDExLjUzMSA0LjIxOEwxNS43ODEgOC40NjhDMTYuMDc0IDguNzYxIDE2LjA3NCA5LjIzNiAxNS43ODEgOS41MjlMMTEuNTMxIDEzLjc3OUMxMS4zODUgMTMuOTI1IDExLjE5MyAxMy45OTkgMTEuMDAxIDEzLjk5OUwxMSAxNFoiPjwvcGF0aD48L2c+PC9zdmc+)
   * @returns
   */
  arrowRight({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M15 9.75H2.75C2.336 9.75 2 9.414 2 9C2 8.586 2.336 8.25 2.75 8.25H15C15.414 8.25 15.75 8.586 15.75 9C15.75 9.414 15.414 9.75 15 9.75Z"
          />
          <path d="M11 14C10.808 14 10.616 13.927 10.47 13.78C10.177 13.487 10.177 13.012 10.47 12.719L14.19 8.99899L10.47 5.279C10.177 4.986 10.177 4.511 10.47 4.218C10.763 3.925 11.238 3.925 11.531 4.218L15.781 8.468C16.074 8.761 16.074 9.236 15.781 9.529L11.531 13.779C11.385 13.925 11.193 13.999 11.001 13.999L11 14Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIG9wYWNpdHk9IjAuNCIgZD0iTTE1LjI1IDkuNzVIM0MyLjU4NiA5Ljc1IDIuMjUgOS40MTQgMi4yNSA5QzIuMjUgOC41ODYgMi41ODYgOC4yNSAzIDguMjVIMTUuMjVDMTUuNjY0IDguMjUgMTYgOC41ODYgMTYgOUMxNiA5LjQxNCAxNS42NjQgOS43NSAxNS4yNSA5Ljc1WiI+PC9wYXRoPjxwYXRoIGQ9Ik02Ljk5OTk5IDE0QzYuODA3OTkgMTQgNi42MTU5OSAxMy45MjcgNi40Njk5OSAxMy43OEwyLjIxOTk5IDkuNTI5OTlDMS45MjY5OSA5LjIzNjk5IDEuOTI2OTkgOC43NjE5OSAyLjIxOTk5IDguNDY4OTlMNi40Njk5OSA0LjIxOTk5QzYuNzYyOTkgMy45MjY5OSA3LjIzOCAzLjkyNjk5IDcuNTMxIDQuMjE5OTlDNy44MjQgNC41MTI5OSA3LjgyNCA0Ljk4OCA3LjUzMSA1LjI4MUwzLjgxMSA5LjAwMUw3LjUzMSAxMi43MjFDNy44MjQgMTMuMDE0IDcuODI0IDEzLjQ4OSA3LjUzMSAxMy43ODJDNy4zODUgMTMuOTI4IDcuMTkzIDE0LjAwMiA3LjAwMSAxNC4wMDJMNi45OTk5OSAxNFoiPjwvcGF0aD48L2c+PC9zdmc+)
   * @returns
   */
  arrowLeft({ size, color, className }: IconProps) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M15.25 9.75H3C2.586 9.75 2.25 9.414 2.25 9C2.25 8.586 2.586 8.25 3 8.25H15.25C15.664 8.25 16 8.586 16 9C16 9.414 15.664 9.75 15.25 9.75Z"
          />
          <path d="M6.99999 14C6.80799 14 6.61599 13.927 6.46999 13.78L2.21999 9.52999C1.92699 9.23699 1.92699 8.76199 2.21999 8.46899L6.46999 4.21999C6.76299 3.92699 7.238 3.92699 7.531 4.21999C7.824 4.51299 7.824 4.988 7.531 5.281L3.811 9.001L7.531 12.721C7.824 13.014 7.824 13.489 7.531 13.782C7.385 13.928 7.193 14.002 7.001 14.002L6.99999 14Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNC43NSAzLjVDNC4wNTkyMSAzLjUgMy41IDQuMDU5MjEgMy41IDQuNzVWNi4yNUMzLjUgNi42NjQyMSAzLjE2NDIxIDcgMi43NSA3QzIuMzM1NzkgNyAyIDYuNjY0MjEgMiA2LjI1VjQuNzVDMiAzLjIzMDc5IDMuMjMwNzkgMiA0Ljc1IDJINi43NUM3LjE2NDIxIDIgNy41IDIuMzM1NzkgNy41IDIuNzVDNy41IDMuMTY0MjEgNy4xNjQyMSAzLjUgNi43NSAzLjVINC43NVoiIGZpbGwtb3BhY2l0eT0iMC40Ij48L3BhdGg+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMC41IDIuNzVDMTAuNSAyLjMzNTc5IDEwLjgzNTggMiAxMS4yNSAySDEzLjI1QzE0Ljc2OTIgMiAxNiAzLjIzMDc5IDE2IDQuNzVWNi4yNUMxNiA2LjY2NDIxIDE1LjY2NDIgNyAxNS4yNSA3QzE0LjgzNTggNyAxNC41IDYuNjY0MjEgMTQuNSA2LjI1VjQuNzVDMTQuNSA0LjA1OTIxIDEzLjk0MDggMy41IDEzLjI1IDMuNUgxMS4yNUMxMC44MzU4IDMuNSAxMC41IDMuMTY0MjEgMTAuNSAyLjc1WiIgZmlsbC1vcGFjaXR5PSIwLjQiPjwvcGF0aD48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1LjI1IDExQzE1LjY2NDIgMTEgMTYgMTEuMzM1OCAxNiAxMS43NVYxMy4yNUMxNiAxNC43NjkyIDE0Ljc2OTIgMTYgMTMuMjUgMTZIMTEuMjVDMTAuODM1OCAxNiAxMC41IDE1LjY2NDIgMTAuNSAxNS4yNUMxMC41IDE0LjgzNTggMTAuODM1OCAxNC41IDExLjI1IDE0LjVIMTMuMjVDMTMuOTQwOCAxNC41IDE0LjUgMTMuOTQwOCAxNC41IDEzLjI1VjExLjc1QzE0LjUgMTEuMzM1OCAxNC44MzU4IDExIDE1LjI1IDExWiIgZmlsbC1vcGFjaXR5PSIwLjQiPjwvcGF0aD48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIuNzUgMTFDMy4xNjQyMSAxMSAzLjUgMTEuMzM1OCAzLjUgMTEuNzVWMTMuMjVDMy41IDEzLjk0MDggNC4wNTkyMSAxNC41IDQuNzUgMTQuNUg2Ljc1QzcuMTY0MjEgMTQuNSA3LjUgMTQuODM1OCA3LjUgMTUuMjVDNy41IDE1LjY2NDIgNy4xNjQyMSAxNiA2Ljc1IDE2SDQuNzVDMy4yMzA3OSAxNiAyIDE0Ljc2OTIgMiAxMy4yNVYxMS43NUMyIDExLjMzNTggMi4zMzU3OSAxMSAyLjc1IDExWiIgZmlsbC1vcGFjaXR5PSIwLjQiPjwvcGF0aD48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEgOUMxIDguNTg1NzkgMS4zMzU3OSA4LjI1IDEuNzUgOC4yNUgxNi4yNUMxNi42NjQyIDguMjUgMTcgOC41ODU3OSAxNyA5QzE3IDkuNDE0MjEgMTYuNjY0MiA5Ljc1IDE2LjI1IDkuNzVIMS43NUMxLjMzNTc5IDkuNzUgMSA5LjQxNDIxIDEgOVoiPjwvcGF0aD48L2c+PC9zdmc+)
   * @returns
   */
  scan({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.75 3.5C4.05921 3.5 3.5 4.05921 3.5 4.75V6.25C3.5 6.66421 3.16421 7 2.75 7C2.33579 7 2 6.66421 2 6.25V4.75C2 3.23079 3.23079 2 4.75 2H6.75C7.16421 2 7.5 2.33579 7.5 2.75C7.5 3.16421 7.16421 3.5 6.75 3.5H4.75Z"
            fillOpacity="0.4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.5 2.75C10.5 2.33579 10.8358 2 11.25 2H13.25C14.7692 2 16 3.23079 16 4.75V6.25C16 6.66421 15.6642 7 15.25 7C14.8358 7 14.5 6.66421 14.5 6.25V4.75C14.5 4.05921 13.9408 3.5 13.25 3.5H11.25C10.8358 3.5 10.5 3.16421 10.5 2.75Z"
            fillOpacity="0.4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.25 11C15.6642 11 16 11.3358 16 11.75V13.25C16 14.7692 14.7692 16 13.25 16H11.25C10.8358 16 10.5 15.6642 10.5 15.25C10.5 14.8358 10.8358 14.5 11.25 14.5H13.25C13.9408 14.5 14.5 13.9408 14.5 13.25V11.75C14.5 11.3358 14.8358 11 15.25 11Z"
            fillOpacity="0.4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.75 11C3.16421 11 3.5 11.3358 3.5 11.75V13.25C3.5 13.9408 4.05921 14.5 4.75 14.5H6.75C7.16421 14.5 7.5 14.8358 7.5 15.25C7.5 15.6642 7.16421 16 6.75 16H4.75C3.23079 16 2 14.7692 2 13.25V11.75C2 11.3358 2.33579 11 2.75 11Z"
            fillOpacity="0.4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 9C1 8.58579 1.33579 8.25 1.75 8.25H16.25C16.6642 8.25 17 8.58579 17 9C17 9.41421 16.6642 9.75 16.25 9.75H1.75C1.33579 9.75 1 9.41421 1 9Z"
          />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![img](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzIxMjEyMSI+PHBhdGggZD0iTTkgMTYuMjVDMTMuMDA0MSAxNi4yNSAxNi4yNSAxMy4wMDQxIDE2LjI1IDlDMTYuMjUgNC45OTU5NCAxMy4wMDQxIDEuNzUgOSAxLjc1QzQuOTk1OTQgMS43NSAxLjc1IDQuOTk1OTQgMS43NSA5QzEuNzUgMTMuMDA0MSA0Ljk5NTk0IDE2LjI1IDkgMTYuMjVaIiBmaWxsPSIjMjEyMTIxIiBmaWxsLW9wYWNpdHk9IjAuMyIgZGF0YS1zdHJva2U9Im5vbmUiIHN0cm9rZT0ibm9uZSI+PC9wYXRoPjxwYXRoIGQ9Ik05IDE2LjI1QzEzLjAwNDEgMTYuMjUgMTYuMjUgMTMuMDA0MSAxNi4yNSA5QzE2LjI1IDQuOTk1OTQgMTMuMDA0MSAxLjc1IDkgMS43NUM0Ljk5NTk0IDEuNzUgMS43NSA0Ljk5NTk0IDEuNzUgOUMxLjc1IDEzLjAwNDEgNC45OTU5NCAxNi4yNSA5IDE2LjI1WiI+PC9wYXRoPjxwYXRoIGQ9Ik05IDEyLjgxOVY4LjI1Ij48L3BhdGg+PHBhdGggZD0iTTkgNi43NUM4LjQ0OCA2Ljc1IDggNi4zMDEgOCA1Ljc1QzggNS4xOTkgOC40NDggNC43NSA5IDQuNzVDOS41NTIgNC43NSAxMCA1LjE5OSAxMCA1Ljc1QzEwIDYuMzAxIDkuNTUyIDYuNzUgOSA2Ljc1WiIgZmlsbD0iIzIxMjEyMSIgZGF0YS1zdHJva2U9Im5vbmUiIHN0cm9rZT0ibm9uZSI+PC9wYXRoPjwvZz48L3N2Zz4=)
   * @returns
   */
  circleInfo({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <path
            d="M9 16.25C13.0041 16.25 16.25 13.0041 16.25 9C16.25 4.99594 13.0041 1.75 9 1.75C4.99594 1.75 1.75 4.99594 1.75 9C1.75 13.0041 4.99594 16.25 9 16.25Z"
            fill={color || "currentColor"}
            fillOpacity="0.3"
            data-stroke="none"
            stroke="none"
          />
          <path d="M9 16.25C13.0041 16.25 16.25 13.0041 16.25 9C16.25 4.99594 13.0041 1.75 9 1.75C4.99594 1.75 1.75 4.99594 1.75 9C1.75 13.0041 4.99594 16.25 9 16.25Z" />
          <path d="M9 12.819V8.25" />
          <path
            d="M9 6.75C8.448 6.75 8 6.301 8 5.75C8 5.199 8.448 4.75 9 4.75C9.552 4.75 10 5.199 10 5.75C10 6.301 9.552 6.75 9 6.75Z"
            fill={color || "currentColor"}
            data-stroke="none"
            stroke="none"
          />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIGQ9Ik04LjUxMDQ2IDEuODM0NTFDOC41MDIyNCAxLjYxODQzIDguNDAxMTYgMS40MTY0MSA4LjIzMzE1IDEuMjgwMjhDOC4wNjUxMyAxLjE0NDE1IDcuODQ2NTQgMS4wODcxNiA3LjYzMzQ1IDEuMTIzOTRDMy44NjgxNyAxLjc3MzczIDEgNS4wNDY1NSAxIDkuMDAwMDFDMSAxMy40MTgyIDQuNTgxNzkgMTcgOSAxN0MxMy40MTgyIDE3IDE3IDEzLjQxODIgMTcgOS4wMDAwMUMxNyA4LjUxNDA5IDE2Ljk0OTYgOC4wNDY3OSAxNi44NzA2IDcuNTk4NzdDMTYuODMxNCA3LjM3NjcgMTYuNjk0NCA3LjE4NDAzIDE2LjQ5NzUgNy4wNzQxMkMxNi4zMDA2IDYuOTY0MjEgMTYuMDY0NyA2Ljk0ODc0IDE1Ljg1NTEgNy4wMzE5OEMxNS41MDU4IDcuMTcwNzMgMTUuMTM0NiA3LjI1MDAxIDE0Ljc1IDcuMjUwMDFDMTMuMjI4NCA3LjI1MDAxIDExLjk3ODkgNi4xMDg2NCAxMS43OTExIDQuNjI1NzVDMTEuNzM5OSA0LjIyMjE2IDExLjM3NjQgMy45MzI5MyAxMC45NzE2IDMuOTczODFDMTAuODc4OSAzLjk4MzE3IDEwLjgxODcgNC4wMDAwMSAxMC43NSA0LjAwMDAxQzkuNTQwMzUgNC4wMDAwMSA4LjU1NjM0IDMuMDQwOTIgOC41MTA0NiAxLjgzNDUxWiIgZmlsbC1vcGFjaXR5PSIwLjQiPjwvcGF0aD48cGF0aCBkPSJNMTIuMjUgMi41QzEyLjY2NCAyLjUgMTMgMi4xNjQyIDEzIDEuNzVDMTMgMS4zMzU4IDEyLjY2NCAxIDEyLjI1IDFDMTEuODM2IDEgMTEuNSAxLjMzNTggMTEuNSAxLjc1QzExLjUgMi4xNjQyIDExLjgzNiAyLjUgMTIuMjUgMi41WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNC43NSA1QzE1LjE2NCA1IDE1LjUgNC42NjQyIDE1LjUgNC4yNUMxNS41IDMuODM1OCAxNS4xNjQgMy41IDE0Ljc1IDMuNUMxNC4zMzYgMy41IDE0IDMuODM1OCAxNCA0LjI1QzE0IDQuNjY0MiAxNC4zMzYgNSAxNC43NSA1WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xMS4yNSAxMi41QzExLjY2NCAxMi41IDEyIDEyLjE2NDIgMTIgMTEuNzVDMTIgMTEuMzM1OCAxMS42NjQgMTEgMTEuMjUgMTFDMTAuODM2IDExIDEwLjUgMTEuMzM1OCAxMC41IDExLjc1QzEwLjUgMTIuMTY0MiAxMC44MzYgMTIuNSAxMS4yNSAxMi41WiI+PC9wYXRoPjxwYXRoIGQ9Ik03IDhDNy41NTIgOCA4IDcuNTUyMyA4IDdDOCA2LjQ0NzcgNy41NTIgNiA3IDZDNi40NDggNiA2IDYuNDQ3NyA2IDdDNiA3LjU1MjMgNi40NDggOCA3IDhaIj48L3BhdGg+PHBhdGggZD0iTTcuMjUgMTIuNUM3Ljk0IDEyLjUgOC41IDExLjk0MDQgOC41IDExLjI1QzguNSAxMC41NTk2IDcuOTQgMTAgNy4yNSAxMEM2LjU2IDEwIDYgMTAuNTU5NiA2IDExLjI1QzYgMTEuOTQwNCA2LjU2IDEyLjUgNy4yNSAxMi41WiI+PC9wYXRoPjwvZz48L3N2Zz4=)
   * @returns
   */
  cookie({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            d="M8.51046 1.83451C8.50224 1.61843 8.40116 1.41641 8.23315 1.28028C8.06513 1.14415 7.84654 1.08716 7.63345 1.12394C3.86817 1.77373 1 5.04655 1 9.00001C1 13.4182 4.58179 17 9 17C13.4182 17 17 13.4182 17 9.00001C17 8.51409 16.9496 8.04679 16.8706 7.59877C16.8314 7.3767 16.6944 7.18403 16.4975 7.07412C16.3006 6.96421 16.0647 6.94874 15.8551 7.03198C15.5058 7.17073 15.1346 7.25001 14.75 7.25001C13.2284 7.25001 11.9789 6.10864 11.7911 4.62575C11.7399 4.22216 11.3764 3.93293 10.9716 3.97381C10.8789 3.98317 10.8187 4.00001 10.75 4.00001C9.54035 4.00001 8.55634 3.04092 8.51046 1.83451Z"
            fill-opacity="0.4"
          />
          <path d="M12.25 2.5C12.664 2.5 13 2.1642 13 1.75C13 1.3358 12.664 1 12.25 1C11.836 1 11.5 1.3358 11.5 1.75C11.5 2.1642 11.836 2.5 12.25 2.5Z" />
          <path d="M14.75 5C15.164 5 15.5 4.6642 15.5 4.25C15.5 3.8358 15.164 3.5 14.75 3.5C14.336 3.5 14 3.8358 14 4.25C14 4.6642 14.336 5 14.75 5Z" />
          <path d="M11.25 12.5C11.664 12.5 12 12.1642 12 11.75C12 11.3358 11.664 11 11.25 11C10.836 11 10.5 11.3358 10.5 11.75C10.5 12.1642 10.836 12.5 11.25 12.5Z" />
          <path d="M7 8C7.552 8 8 7.5523 8 7C8 6.4477 7.552 6 7 6C6.448 6 6 6.4477 6 7C6 7.5523 6.448 8 7 8Z" />
          <path d="M7.25 12.5C7.94 12.5 8.5 11.9404 8.5 11.25C8.5 10.5596 7.94 10 7.25 10C6.56 10 6 10.5596 6 11.25C6 11.9404 6.56 12.5 7.25 12.5Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIG9wYWNpdHk9IjAuNCIgZD0iTTIuNzUgNy41QzMuMTY0IDcuNSAzLjUgNy4xNjQgMy41IDYuNzVWNC43NUMzLjUgNC4wNjEgNC4wNjEgMy41IDQuNzUgMy41SDYuNzVDNy4xNjQgMy41IDcuNSAzLjE2NCA3LjUgMi43NUM3LjUgMi4zMzYgNy4xNjQgMiA2Ljc1IDJINC43NUMzLjIzMyAyIDIgMy4yMzMgMiA0Ljc1VjYuNzVDMiA3LjE2NCAyLjMzNiA3LjUgMi43NSA3LjVaIj48L3BhdGg+PHBhdGggb3BhY2l0eT0iMC40IiBkPSJNMTMuMjUgMkgxMS4yNUMxMC44MzYgMiAxMC41IDIuMzM2IDEwLjUgMi43NUMxMC41IDMuMTY0IDEwLjgzNiAzLjUgMTEuMjUgMy41SDEzLjI1QzEzLjkzOSAzLjUgMTQuNSA0LjA2MSAxNC41IDQuNzVWNi43NUMxNC41IDcuMTY0IDE0LjgzNiA3LjUgMTUuMjUgNy41QzE1LjY2NCA3LjUgMTYgNy4xNjQgMTYgNi43NVY0Ljc1QzE2IDMuMjMzIDE0Ljc2NyAyIDEzLjI1IDJaIj48L3BhdGg+PHBhdGggb3BhY2l0eT0iMC40IiBkPSJNMTUuMjUgMTAuNUMxNC44MzYgMTAuNSAxNC41IDEwLjgzNiAxNC41IDExLjI1VjEzLjI1QzE0LjUgMTMuOTM5IDEzLjkzOSAxNC41IDEzLjI1IDE0LjVIMTEuMjVDMTAuODM2IDE0LjUgMTAuNSAxNC44MzYgMTAuNSAxNS4yNUMxMC41IDE1LjY2NCAxMC44MzYgMTYgMTEuMjUgMTZIMTMuMjVDMTQuNzY3IDE2IDE2IDE0Ljc2NyAxNiAxMy4yNVYxMS4yNUMxNiAxMC44MzYgMTUuNjY0IDEwLjUgMTUuMjUgMTAuNVoiPjwvcGF0aD48cGF0aCBvcGFjaXR5PSIwLjQiIGQ9Ik02Ljc1IDE0LjVINC43NUM0LjA2MSAxNC41IDMuNSAxMy45MzkgMy41IDEzLjI1VjExLjI1QzMuNSAxMC44MzYgMy4xNjQgMTAuNSAyLjc1IDEwLjVDMi4zMzYgMTAuNSAyIDEwLjgzNiAyIDExLjI1VjEzLjI1QzIgMTQuNzY3IDMuMjMzIDE2IDQuNzUgMTZINi43NUM3LjE2NCAxNiA3LjUgMTUuNjY0IDcuNSAxNS4yNUM3LjUgMTQuODM2IDcuMTY0IDE0LjUgNi43NSAxNC41WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xMi4yOCA4Ljk2OTk3QzExLjk4NyA4LjY3Njk3IDExLjUxMiA4LjY3Njk3IDExLjIxOSA4Ljk2OTk3TDkuNzQ4OTkgMTAuNDM5OVY1LjI1QzkuNzQ4OTkgNC44MzYgOS40MTI5OSA0LjUgOC45OTg5OSA0LjVDOC41ODQ5OSA0LjUgOC4yNDg5OSA0LjgzNiA4LjI0ODk5IDUuMjVWMTAuNDM5TDYuNzc5IDguOTY4OTlDNi40ODYgOC42NzU5OSA2LjAxMSA4LjY3NTk5IDUuNzE4IDguOTY4OTlDNS40MjUgOS4yNjE5OSA1LjQyNSA5LjczNzAzIDUuNzE4IDEwLjAzTDguNDY4IDEyLjc4QzguNjE0IDEyLjkyNiA4LjgwNTk5IDEzIDguOTk3OTkgMTNDOS4xODk5OSAxMyA5LjM4MTk5IDEyLjkyNyA5LjUyNzk5IDEyLjc4TDEyLjI3OCAxMC4wM0MxMi41NzEgOS43MzcwMyAxMi41NzEgOS4yNjE5OSAxMi4yNzggOC45Njg5OUwxMi4yOCA4Ljk2OTk3WiI+PC9wYXRoPjwvZz48L3N2Zz4=)
   * @returns
   */
  squareDashedDownload({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M2.75 7.5C3.164 7.5 3.5 7.164 3.5 6.75V4.75C3.5 4.061 4.061 3.5 4.75 3.5H6.75C7.164 3.5 7.5 3.164 7.5 2.75C7.5 2.336 7.164 2 6.75 2H4.75C3.233 2 2 3.233 2 4.75V6.75C2 7.164 2.336 7.5 2.75 7.5Z"
          />
          <path
            opacity="0.4"
            d="M13.25 2H11.25C10.836 2 10.5 2.336 10.5 2.75C10.5 3.164 10.836 3.5 11.25 3.5H13.25C13.939 3.5 14.5 4.061 14.5 4.75V6.75C14.5 7.164 14.836 7.5 15.25 7.5C15.664 7.5 16 7.164 16 6.75V4.75C16 3.233 14.767 2 13.25 2Z"
          />
          <path
            opacity="0.4"
            d="M15.25 10.5C14.836 10.5 14.5 10.836 14.5 11.25V13.25C14.5 13.939 13.939 14.5 13.25 14.5H11.25C10.836 14.5 10.5 14.836 10.5 15.25C10.5 15.664 10.836 16 11.25 16H13.25C14.767 16 16 14.767 16 13.25V11.25C16 10.836 15.664 10.5 15.25 10.5Z"
          />
          <path
            opacity="0.4"
            d="M6.75 14.5H4.75C4.061 14.5 3.5 13.939 3.5 13.25V11.25C3.5 10.836 3.164 10.5 2.75 10.5C2.336 10.5 2 10.836 2 11.25V13.25C2 14.767 3.233 16 4.75 16H6.75C7.164 16 7.5 15.664 7.5 15.25C7.5 14.836 7.164 14.5 6.75 14.5Z"
          />
          <path d="M12.28 8.96997C11.987 8.67697 11.512 8.67697 11.219 8.96997L9.74899 10.4399V5.25C9.74899 4.836 9.41299 4.5 8.99899 4.5C8.58499 4.5 8.24899 4.836 8.24899 5.25V10.439L6.779 8.96899C6.486 8.67599 6.011 8.67599 5.718 8.96899C5.425 9.26199 5.425 9.73703 5.718 10.03L8.468 12.78C8.614 12.926 8.80599 13 8.99799 13C9.18999 13 9.38199 12.927 9.52799 12.78L12.278 10.03C12.571 9.73703 12.571 9.26199 12.278 8.96899L12.28 8.96997Z" />
        </g>
      </svg>
    );
  },

  /**
   * @preview ![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIG9wYWNpdHk9IjAuNCIgZD0iTTIuNzUgNy41QzMuMTY0IDcuNSAzLjUgNy4xNjQgMy41IDYuNzVWNC43NUMzLjUgNC4wNjEgNC4wNjEgMy41IDQuNzUgMy41SDYuNzVDNy4xNjQgMy41IDcuNSAzLjE2NCA3LjUgMi43NUM3LjUgMi4zMzYgNy4xNjQgMiA2Ljc1IDJINC43NUMzLjIzMyAyIDIgMy4yMzMgMiA0Ljc1VjYuNzVDMiA3LjE2NCAyLjMzNiA3LjUgMi43NSA3LjVaIj48L3BhdGg+PHBhdGggb3BhY2l0eT0iMC40IiBkPSJNMTMuMjUgMkgxMS4yNUMxMC44MzYgMiAxMC41IDIuMzM2IDEwLjUgMi43NUMxMC41IDMuMTY0IDEwLjgzNiAzLjUgMTEuMjUgMy41SDEzLjI1QzEzLjkzOSAzLjUgMTQuNSA0LjA2MSAxNC41IDQuNzVWNi43NUMxNC41IDcuMTY0IDE0LjgzNiA3LjUgMTUuMjUgNy41QzE1LjY2NCA3LjUgMTYgNy4xNjQgMTYgNi43NVY0Ljc1QzE2IDMuMjMzIDE0Ljc2NyAyIDEzLjI1IDJaIj48L3BhdGg+PHBhdGggb3BhY2l0eT0iMC40IiBkPSJNMTUuMjUgMTAuNUMxNC44MzYgMTAuNSAxNC41IDEwLjgzNiAxNC41IDExLjI1VjEzLjI1QzE0LjUgMTMuOTM5IDEzLjkzOSAxNC41IDEzLjI1IDE0LjVIMTEuMjVDMTAuODM2IDE0LjUgMTAuNSAxNC44MzYgMTAuNSAxNS4yNUMxMC41IDE1LjY2NCAxMC44MzYgMTYgMTEuMjUgMTZIMTMuMjVDMTQuNzY3IDE2IDE2IDE0Ljc2NyAxNiAxMy4yNVYxMS4yNUMxNiAxMC44MzYgMTUuNjY0IDEwLjUgMTUuMjUgMTAuNVoiPjwvcGF0aD48cGF0aCBvcGFjaXR5PSIwLjQiIGQ9Ik02Ljc1IDE0LjVINC43NUM0LjA2MSAxNC41IDMuNSAxMy45MzkgMy41IDEzLjI1VjExLjI1QzMuNSAxMC44MzYgMy4xNjQgMTAuNSAyLjc1IDEwLjVDMi4zMzYgMTAuNSAyIDEwLjgzNiAyIDExLjI1VjEzLjI1QzIgMTQuNzY3IDMuMjMzIDE2IDQuNzUgMTZINi43NUM3LjE2NCAxNiA3LjUgMTUuNjY0IDcuNSAxNS4yNUM3LjUgMTQuODM2IDcuMTY0IDE0LjUgNi43NSAxNC41WiI+PC9wYXRoPjxwYXRoIGQ9Ik0xMS4yMiA5LjAzMDA1QzExLjM2NiA5LjE3NjA1IDExLjU1OCA5LjI1MDAyIDExLjc1IDkuMjUwMDJDMTEuOTQyIDkuMjUwMDIgMTIuMTM0IDkuMTc3MDUgMTIuMjggOS4wMzAwNUMxMi41NzMgOC43MzcwNSAxMi41NzMgOC4yNjIwMiAxMi4yOCA3Ljk2OTAyTDkuNTI5OTkgNS4yMTkwMkM5LjIzNjk5IDQuOTI2MDIgOC43NjE5OSA0LjkyNjAyIDguNDY4OTkgNS4yMTkwMkw1LjcxODk5IDcuOTY5MDJDNS40MjU5OSA4LjI2MjAyIDUuNDI1OTkgOC43MzcwNSA1LjcxODk5IDkuMDMwMDVDNi4wMTE5OSA5LjMyMzA1IDYuNDg2OTkgOS4zMjMwNSA2Ljc3OTk5IDkuMDMwMDVMOC4yNDk5OSA3LjU2MDA4VjEyLjc0OUM4LjI0OTk5IDEzLjE2MyA4LjU4NTk5IDEzLjQ5OSA4Ljk5OTk5IDEzLjQ5OUM5LjQxMzk5IDEzLjQ5OSA5Ljc0OTk5IDEzLjE2MyA5Ljc0OTk5IDEyLjc0OVY3LjU2MTA2TDExLjIyIDkuMDMwMDVaIj48L3BhdGg+PC9nPjwvc3ZnPg==)
   */
  squareDashedUpload({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 18}
        height={size || 18}
        viewBox="0 0 18 18"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            opacity="0.4"
            d="M2.75 7.5C3.164 7.5 3.5 7.164 3.5 6.75V4.75C3.5 4.061 4.061 3.5 4.75 3.5H6.75C7.164 3.5 7.5 3.164 7.5 2.75C7.5 2.336 7.164 2 6.75 2H4.75C3.233 2 2 3.233 2 4.75V6.75C2 7.164 2.336 7.5 2.75 7.5Z"
          />
          <path
            opacity="0.4"
            d="M13.25 2H11.25C10.836 2 10.5 2.336 10.5 2.75C10.5 3.164 10.836 3.5 11.25 3.5H13.25C13.939 3.5 14.5 4.061 14.5 4.75V6.75C14.5 7.164 14.836 7.5 15.25 7.5C15.664 7.5 16 7.164 16 6.75V4.75C16 3.233 14.767 2 13.25 2Z"
          />
          <path
            opacity="0.4"
            d="M15.25 10.5C14.836 10.5 14.5 10.836 14.5 11.25V13.25C14.5 13.939 13.939 14.5 13.25 14.5H11.25C10.836 14.5 10.5 14.836 10.5 15.25C10.5 15.664 10.836 16 11.25 16H13.25C14.767 16 16 14.767 16 13.25V11.25C16 10.836 15.664 10.5 15.25 10.5Z"
          />
          <path
            opacity="0.4"
            d="M6.75 14.5H4.75C4.061 14.5 3.5 13.939 3.5 13.25V11.25C3.5 10.836 3.164 10.5 2.75 10.5C2.336 10.5 2 10.836 2 11.25V13.25C2 14.767 3.233 16 4.75 16H6.75C7.164 16 7.5 15.664 7.5 15.25C7.5 14.836 7.164 14.5 6.75 14.5Z"
          />
          <path d="M11.22 9.03005C11.366 9.17605 11.558 9.25002 11.75 9.25002C11.942 9.25002 12.134 9.17705 12.28 9.03005C12.573 8.73705 12.573 8.26202 12.28 7.96902L9.52999 5.21902C9.23699 4.92602 8.76199 4.92602 8.46899 5.21902L5.71899 7.96902C5.42599 8.26202 5.42599 8.73705 5.71899 9.03005C6.01199 9.32305 6.48699 9.32305 6.77999 9.03005L8.24999 7.56008V12.749C8.24999 13.163 8.58599 13.499 8.99999 13.499C9.41399 13.499 9.74999 13.163 9.74999 12.749V7.56106L11.22 9.03005Z" />
        </g>
      </svg>
    );
  },
  /**
   *
   * @preview ![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgdmlld0JveD0iMCAwIDE4IDE4Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjxnIGZpbGw9IiMyMTIxMjEiPjxwYXRoIGQ9Ik05LjU3LDMuNjE3Yy0uMTU2LS4zNzUtLjUxOS0uNjE3LS45MjQtLjYxN0g0Yy0uNTUyLDAtMSwuNDQ5LTEsMXY0LjY0NmMwLC40MDYsLjI0MiwuNzY5LC42MTgsLjkyNCwuMTI0LC4wNTEsLjI1NSwuMDc2LC4zODMsLjA3NiwuMjYxLDAsLjUxNS0uMTAyLC43MDYtLjI5M2w0LjY0Ny00LjY0N2MuMjg2LS4yODcsLjM3MS0uNzE1LC4yMTYtMS4wODlaIj48L3BhdGg+PHBhdGggZD0iTTE0LjM4Miw4LjQyOWMtLjM3Ny0uMTU2LS44MDQtLjA2OC0xLjA4OSwuMjE3bC00LjY0Nyw0LjY0N2MtLjI4NiwuMjg3LS4zNzEsLjcxNS0uMjE2LDEuMDg5LC4xNTYsLjM3NSwuNTE5LC42MTcsLjkyNCwuNjE3aDQuNjQ2Yy41NTIsMCwxLS40NDksMS0xdi00LjY0NmMwLS40MDYtLjI0Mi0uNzY5LS42MTgtLjkyNFoiPjwvcGF0aD48L2c+PC9zdmc+)
   * @returns
   */
  caretMaximizeDiagonal2({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 12}
        height={size || 12}
        viewBox="0 0 12 12"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            d="m10.383,4.93c-.375-.155-.803-.07-1.09.217l-4.146,4.146c-.287.287-.372.715-.217,1.09s.518.617.924.617h4.146c.551,0,1-.449,1-1v-4.146c0-.406-.242-.769-.617-.924Z"
            strokeWidth="0"
          />
          <path
            d="m6.146,1H2c-.551,0-1,.449-1,1v4.146c0,.406.242.769.617.924.125.052.255.077.384.077.26,0,.514-.102.706-.293L6.854,2.707c.287-.287.372-.715.217-1.09s-.518-.617-.924-.617Z"
            strokeWidth="0"
          />
        </g>
      </svg>
    );
  },
  crateMinimizeDiagonal2({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 12}
        height={size || 12}
        viewBox="0 0 12 12"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            d="m10.896,6h-3.896c-.551,0-1,.449-1,1v3.896c0,.406.243.769.618.924.125.051.254.076.383.076.26,0,.515-.102.706-.293l3.896-3.896c.287-.287.372-.715.217-1.09s-.518-.617-.924-.617Z"
            strokeWidth="0"
          />
          <path
            d="m5.383.18c-.375-.156-.802-.071-1.09.217L.396,4.293c-.287.287-.372.715-.217,1.09s.518.617.924.617h3.896c.551,0,1-.449,1-1V1.104c0-.406-.242-.769-.617-.924Z"
            strokeWidth="0"
          />
        </g>
      </svg>
    );
  },

  minussm({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 12}
        height={size || 12}
        viewBox="0 0 12 12"
        className={className}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          stroke={color || "currentColor"}
        >
          <line x1="10.75" y1="6" x2="1.25" y2="6" />
        </g>
      </svg>
    );
  },
  xmarksm({ size, color, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 12}
        height={size || 12}
        viewBox="0 0 12 12"
        className={className}
      >
        <g fill={color || "currentColor"}>
          <path
            d="m2.25,10.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L9.22,1.72c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-7.5,7.5c-.146.146-.338.22-.53.22Z"
            strokeWidth="0"
          />
          <path
            d="m9.75,10.5c-.192,0-.384-.073-.53-.22L1.72,2.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l7.5,7.5c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
            strokeWidth="0"
          />
        </g>
      </svg>
    );
  },
};
