import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import styles from "./MyGarage.module.scss";
import garageLogo from "../../assets/images/mygarage/My Garage.svg";

const imageModules = import.meta.glob(
  "../../assets/images/mygarage/**/*.svg",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const images = Object.fromEntries(
  Object.entries(imageModules).map(([path, url]) => [
    path.split("/").pop().normalize("NFC"),
    url,
  ]),
);

function getImage(prefix, name, selected = false) {
  if (name == null) return undefined;

  const suffix = selected ? "(선택됨)" : "";
  const filename =
    `${prefix} - ${name}${suffix}.svg`.normalize("NFC");

  // 현재 저장소의 파일명에 공백이 2개 들어 있는 항목
  if (
    prefix === "팀 선택" &&
    name === "애스턴 마틴" &&
    !selected
  ) {
    return (
      images[filename] ??
      images["팀 선택 -  애스턴 마틴.svg"]
    );
  }

  return images[filename];
}

// 화면 확인용 하드코딩 데이터
const TEAMS = [
  {
    name: "메르세데스",
    drivers: ["조지 러셀", "키미 안토넬리"],
  },
  {
    name: "페라리",
    drivers: ["샤를 르끌레르", "루이스 해밀턴"],
  },
  {
    name: "레드불 레이싱",
    drivers: ["막스 베르스타펜", "아이작 하자르"],
  },
  {
    name: "맥라렌",
    drivers: ["랜도 노리스", "오스카 피아스트리"],
  },
  {
    name: "레이싱 불스",
    drivers: ["리암 로슨", "아비드 린드블라드"],
  },
  {
    name: "애스턴 마틴",
    drivers: ["페르난도 알론소", "랜스 스트롤"],
  },
  {
    name: "알핀",
    drivers: ["피에르 가슬리", "프랑코 콜라핀토"],
  },
  {
    name: "윌리엄스",
    drivers: ["알렉산더 알본", "카를로스 사인츠"],
  },
  {
    name: "아우디",
    drivers: ["니코 휠켄베르크", "가브리엘 보르톨레토"],
  },
  {
    name: "캐딜락",
    drivers: ["발테리 보타스", "세르히오 페레즈"],
  },
  {
    name: "하스",
    drivers: ["올리버 베어먼", "라파엘 카마라"],
  },
];

const INITIAL_PROFILE = {
  nickname: "해머타임기원",
  bio: "해밀턴 8챔 보기 전엔 못 죽음",
  team: "페라리",
  driver: "루이스 해밀턴",
  showAssets: true,
  avatarSrc: "",
};

const MARKET = {
  totalAssets: 100000,
  returnRate: 2.5,
  rank: 1,
};

// 0~23으로 바꾸면 해당 도장 SVG 표시
const STAMP_COUNT = 5;
const TOTAL_RACES = 23;

function GarageImage({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div className={`${styles.placeholder} ${className}`}>
        {alt}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      draggable={false}
    />
  );
}

function FavoriteCard({
  type,
  name,
  editing,
  onChange,
}) {
  const isTeam = type === "team";

  // 현재 화면용 하드코딩 순위
  const rank = isTeam
    ? { 페라리: 2 }[name]
    : { "루이스 해밀턴": 4 }[name];

  if (!editing) {
    return (
      <section
        className={styles.favoriteCard}
        aria-label={isTeam ? "마이 팀" : "마이 드라이버"}
      >
        <div className={styles.favoriteArtwork}>
          <GarageImage
            src={getImage("마이개러지", name)}
            alt={name ?? "선택한 항목이 없습니다"}
          />
        </div>

        <h2 className={styles.favoriteTitle}>
          {isTeam ? "MY TEAM" : "MY DRIVER"}
        </h2>

        <div className={styles.favoriteFooter}>
          <span className={styles.favoriteName}>
            {name ?? "선택해 주세요"}
          </span>

          {rank != null && (
            <span className={styles.favoriteRank}>
              P{rank}
            </span>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.editCard}>
      <h2>{isTeam ? "MY TEAM" : "MY DRIVER"}</h2>

      <GarageImage
        src={getImage(
          isTeam ? "마이팀" : "마이드라이버",
          name,
        )}
        alt={name ?? "선택해 주세요"}
        className={styles.editFavoriteImage}
      />

      <button
        type="button"
        className={styles.changeButton}
        onClick={onChange}
      >
        변경하기
      </button>
    </section>
  );
}

function SelectionSheet({
  type,
  items,
  current,
  onClose,
  onConfirm,
}) {
  const [selected, setSelected] = useState(current);
  const dialogRef = useRef(null);

  const isTeam = type === "team";
  const prefix = isTeam ? "팀 선택" : "선수 선택";

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;

    dialog?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const buttons = [
        ...dialog.querySelectorAll("button:not(:disabled)"),
      ];

      const first = buttons[0];
      const last = buttons.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first?.focus();
      }
    }

    dialog?.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog?.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      previousFocus?.focus();
    };
  }, [onClose]);

  // 스크롤되는 .content 밖으로 옮겨 #root를 기준으로 표시
  return createPortal(
    <div
      className={styles.overlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="garage-selection-title"
        tabIndex={-1}
      >
        <div className={styles.handle} />

        <h2 id="garage-selection-title">
          {prefix}
        </h2>

        <div
          className={
            isTeam
              ? styles.teamOptions
              : styles.driverOptions
          }
        >
          {items.map((name) => {
            const normalSrc = getImage(prefix, name);
            const selectedSrc = getImage(
              prefix,
              name,
              true,
            );

            return (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={selected === name}
                className={`${styles.option} ${
                  selected === name
                    ? styles.selected
                    : ""
                }`}
                onClick={() => {
                  if (isTeam) {
                    onConfirm(name);
                  } else {
                    setSelected(name);
                  }
                }}
              >
                <div className={styles.normalImage}>
                  <GarageImage
                    src={normalSrc}
                    alt={name}
                  />
                </div>

                <div
                  className={styles.selectedImage}
                  aria-hidden="true"
                >
                  <GarageImage
                    src={selectedSrc ?? normalSrc}
                    alt={name}
                  />
                </div>
              </button>
            );
          })}

          {items.length === 0 && (
            <p className={styles.emptyMessage}>
              팀을 먼저 선택해 주세요.
            </p>
          )}
        </div>

        {!isTeam && (
          <button
            type="button"
            className={styles.confirmButton}
            disabled={!items.includes(selected)}
            onClick={() => onConfirm(selected)}
          >
            확인
          </button>
        )}
      </section>
    </div>,
    document.getElementById("root"),
  );
}

export default function MyGarage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const editing = searchParams.get("edit") === "1";

  const [profile, setProfile] = useState({
    ...INITIAL_PROFILE,
  });
  const [draft, setDraft] = useState({
    ...INITIAL_PROFILE,
  });

  const [sheet, setSheet] = useState(null);
  const [pendingTeam, setPendingTeam] = useState(null);
  const [error, setError] = useState("");
  const [photoLoading, setPhotoLoading] =
    useState(false);

  const photoInputRef = useRef(null);
  const photoReaderRef = useRef(null);

  const current = editing ? draft : profile;

  const hasChanges =
    draft.nickname !== profile.nickname ||
    draft.bio !== profile.bio ||
    draft.team !== profile.team ||
    draft.driver !== profile.driver ||
    draft.showAssets !== profile.showAssets ||
    draft.avatarSrc !== profile.avatarSrc;

  const selectionTeam = pendingTeam ?? draft.team;

  const driverOptions =
    TEAMS.find((team) => team.name === selectionTeam)
      ?.drivers ?? [];

  const stampNumber = Math.min(
    23,
    Math.max(0, STAMP_COUNT),
  );

  const closeSheet = useCallback(() => {
    setSheet(null);
    setPendingTeam(null);
  }, []);

  useEffect(() => {
    return () => {
      photoReaderRef.current?.abort();
    };
  }, []);

  function setEditing(value) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      if (value) {
        next.set("edit", "1");
      } else {
        next.delete("edit");
      }

      return next;
    });
  }

  function updateDraft(key, value) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function startEditing() {
    setDraft({ ...profile });
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    photoReaderRef.current?.abort();

    setPhotoLoading(false);
    setDraft({ ...profile });
    setSheet(null);
    setError("");
    setEditing(false);
  }

  function saveProfile() {
    if (!hasChanges || photoLoading) return;

    const nickname = draft.nickname.trim();

    if (nickname.length < 2 || nickname.length > 20) {
      setError("이름은 2~20자로 입력해 주세요.");
      return;
    }

    setProfile({
      ...draft,
      nickname,
    });

    setDraft((previous) => ({
      ...previous,
      nickname,
    }));

    setError("");
    setEditing(false);
  }

  function changePhoto(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일을 선택해 주세요.");
      return;
    }

    photoReaderRef.current?.abort();

    const reader = new FileReader();
    photoReaderRef.current = reader;

    setPhotoLoading(true);
    setError("");

    reader.onload = () => {
      updateDraft("avatarSrc", reader.result);
      setPhotoLoading(false);
    };

    reader.onerror = () => {
      setError("사진을 불러오지 못했습니다.");
      setPhotoLoading(false);
    };

    reader.onabort = () => {
      setPhotoLoading(false);
    };

    reader.readAsDataURL(file);
  }

  function confirmSelection(name) {
    if (sheet === "team") {
      setPendingTeam(name);
      setSheet("driver");
      return;
    }

    setDraft((previous) => ({
      ...previous,
      team: pendingTeam ?? previous.team,
      driver: name,
    }));

    setPendingTeam(null);
    setSheet(null);
  }

  return (
    <div
      className={`${styles.page} ${
        editing ? styles.editing : ""
      }`}
    >
      {editing ? (
        <header className={styles.editHeader}>
          <button
            type="button"
            className={styles.backButton}
            aria-label="프로필 수정 취소"
            onClick={cancelEditing}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m15 5-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={styles.saveButton}
            disabled={!hasChanges || photoLoading}
            onClick={saveProfile}
          >
            저장
          </button>
        </header>
      ) : (
        <header className={styles.header}>
          <h1 className={styles.logo}>
            <img src={garageLogo} alt="My Garage" />
          </h1>
        </header>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <section
        className={`${styles.profile} ${
          editing ? styles.editProfile : ""
        }`}
      >
        <div className={styles.avatarArea}>
          <div className={styles.avatar}>
            {current.avatarSrc ? (
              <img
                src={current.avatarSrc}
                alt="프로필"
              />
            ) : (
              <span>
                {current.nickname.slice(0, 1) || "B"}
              </span>
            )}
          </div>

          {editing && (
            <>
              <button
                type="button"
                className={styles.photoChange}
                onClick={() =>
                  photoInputRef.current?.click()
                }
              >
                {photoLoading
                  ? "불러오는 중"
                  : "사진 변경"}
              </button>

              <input
                ref={photoInputRef}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                aria-label="프로필 사진 선택"
                onChange={changePhoto}
              />
            </>
          )}
        </div>

        {editing ? (
          <div className={styles.inputs}>
            <label>
              <span>이름</span>

              <input
                value={draft.nickname}
                maxLength={20}
                onChange={(event) =>
                  updateDraft(
                    "nickname",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>소개</span>

              <input
                value={draft.bio}
                maxLength={100}
                onChange={(event) =>
                  updateDraft(
                    "bio",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        ) : (
          <div className={styles.profileText}>
            <h2>{profile.nickname}</h2>

            <p>{profile.bio}</p>

            <div className={styles.followInfo}>
              <span>팔로잉 1</span>
              <span>팔로워 1</span>
            </div>
          </div>
        )}
      </section>

      {!editing && (
        <div className={styles.profileActions}>
          <button type="button">
            메시지 목록
          </button>

          <button
            type="button"
            onClick={startEditing}
          >
            프로필 수정
          </button>
        </div>
      )}

      <div className={styles.favorites}>
        <FavoriteCard
          type="team"
          name={current.team}
          editing={editing}
          onChange={() => setSheet("team")}
        />

        <FavoriteCard
          type="driver"
          name={current.driver}
          editing={editing}
          onChange={() => setSheet("driver")}
        />
      </div>

        <section
          className={`${styles.marketCard} ${
            !current.showAssets ? styles.privateMarketCard : ""
          }`}
        >

        <div className={styles.marketHeader}>
          <h2>MY RACE CARK</h2>

          {editing && (
            <div className={styles.privacy}>
              <span>비공개</span>

              <button
                type="button"
                role="switch"
                aria-label="자산 비공개"
                aria-checked={!draft.showAssets}
                className={`${styles.switch} ${
                  !draft.showAssets ? styles.switchOn : ""
                }`}
                onClick={() =>
                  updateDraft("showAssets", !draft.showAssets)
                }
              >
                <span />
              </button>
            </div>
          )}
        </div>

        {!current.showAssets ? (
          <div className={styles.privateAssets}>
            비공개
          </div>
        ) : (
          <div className={styles.marketStats}>
            <div>
              <span>총자산</span>
              <strong>
                {MARKET.totalAssets.toLocaleString("ko-KR")}
              </strong>
            </div>

            <div>
              <span>수익률</span>
              <strong className={styles.positive}>
                ▲ {MARKET.returnRate}%
              </strong>
            </div>

            <div>
              <span>유저 랭킹</span>
              <strong>
                #{String(MARKET.rank).padStart(3, "0")}
              </strong>
            </div>
          </div>
        )}
      </section>

      <section
        className={styles.stampCard}
        aria-label={`${TOTAL_RACES}개 중 ${STAMP_COUNT}개 레이스 참여`}
      >
        {/* 제목과 숫자가 포함된 SVG를 그대로 표시 */}
        <GarageImage
          src={getImage(
            "레이스 스탬프",
            stampNumber,
          )}
          alt="레이스 스탬프"
          className={styles.stampImage}
        />
      </section>

      {editing && sheet && (
        <SelectionSheet
          key={`${sheet}-${selectionTeam}`}
          type={sheet}
          items={
            sheet === "team"
              ? TEAMS.map((team) => team.name)
              : driverOptions
          }
          current={
            sheet === "team"
              ? draft.team
              : selectionTeam === draft.team
                ? draft.driver
                : null
          }
          onClose={closeSheet}
          onConfirm={confirmSelection}
        />
      )}
    </div>
  );
}