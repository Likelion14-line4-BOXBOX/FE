import backIcon from "../../assets/images/teamradio/back-button.svg";

const assets = import.meta.glob(
  "../../assets/images/teamradio/*.{svg,png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export function BackIcon() {
  return (
    <img
      src={backIcon}
      width="22"
      height="22"
      alt=""
      aria-hidden="true"
    />
  );
}

export function MemberIcon({
  single = false,
}) {
  if (single) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 13.25C1 12.3217 1.36875 11.4315 2.02513 10.7751C2.6815 10.1187 3.57174 9.75 4.5 9.75H11.5C12.4283 9.75 13.3185 10.1187 13.9749 10.7751C14.6313 11.4315 15 12.3217 15 13.25C15 13.7141 14.8156 14.1592 14.4874 14.4874C14.1592 14.8156 13.7141 15 13.25 15H2.75C2.28587 15 1.84075 14.8156 1.51256 14.4874C1.18437 14.1592 1 13.7141 1 13.25Z"
          strokeWidth="2"
          strokeLinejoin="round"
          stroke="#F5F5F6"
        />
        <path
          d="M10.625 3.625C10.625 5.07475 9.44975 6.25 8 6.25C6.55025 6.25 5.375 5.07475 5.375 3.625C5.375 2.17525 6.55025 1 8 1C9.44975 1 10.625 2.17525 10.625 3.625Z"
          strokeWidth="2"
          stroke="#F5F5F6"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      strokeWidth="1.46667"
      stroke="#5A5A5B"
      aria-hidden="true"
    >
      <path d="M5.04175 7.33333C5.04175 9.10406 6.47935 10.5417 8.25008 10.5417C10.0208 10.5417 11.4584 9.10406 11.4584 7.33333C11.4584 5.56261 10.0208 4.125 8.25008 4.125C6.47935 4.125 5.04175 5.56261 5.04175 7.33333V7.33333" />
      <path d="M2.29175 18.3333C3.20841 15.125 5.50008 13.2916 8.25008 13.2916C11.0001 13.2916 13.2917 15.125 14.2084 18.3333" />
      <path d="M14.6667 4.40002C15.8272 4.91416 16.5755 6.0641 16.5755 7.33336C16.5755 8.60262 15.8272 9.75255 14.6667 10.2667M16.5001 13.5667C18.1501 14.3 19.2501 15.95 19.7084 18.3334" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" />
    </svg>
  );
}

export function PaperPlaneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0.335449 7.41667L13.6688 0.75L8.66878 14.0833L6.16878 9.08333L0.335449 7.41667"
        strokeWidth="1.5"
        strokeLinejoin="round"
        stroke="white"
      />
    </svg>
  );
}

export function Asset({
  name,
  fallback,
  className = "",
  selected = false,
  hoverName,
}) {
  const selectedSrc =
    selected && hoverName
      ? assets[
          `../../assets/images/teamradio/${hoverName}.svg`
        ]
      : null;

  const src =
    selectedSrc ||
    assets[
      `../../assets/images/teamradio/${name}.svg`
    ];

  return src ? (
    <img
      className={className}
      src={src}
      alt={fallback}
    />
  ) : (
    <span className={className}>
      {fallback}
    </span>
  );
}