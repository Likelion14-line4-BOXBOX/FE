import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import LoginGuide from "../../components/common/LoginGuide/LoginGuide";
import styles from "./MyGarage.module.scss";
import garageLogo from "../../assets/images/mygarage/My Garage.svg";
import {
  saveGarageProfile,
} from "../../shared/garageProfile";

import {
  getGarageAccessToken,
  updateMyGarageProfile,
  USE_MOCK,
  useMyGarageData,
  createProfilePatch,
  displayName,
  toGarageProfile,
} from "../../api/myGarageApi";

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

export function FavoriteCard({
  type,
  name,
  editing = false,
  onChange,
  rank: suppliedRank,
}) {
  const isTeam = type === "team";
  const defaultRank = isTeam
    ? { 페라리: 2 }[name]
    : { "루이스 해밀턴": 4 }[name];

  const rank =
    suppliedRank === undefined
      ? defaultRank
      : suppliedRank;

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

export default function MyGarage({
  currentUser = null,
  onLogin,
  accessToken,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const editing = searchParams.get("edit") === "1";

  const token =
    accessToken ??
    currentUser?.accessToken ??
    getGarageAccessToken();

  const garage = useMyGarageData({
    enabled: Boolean(currentUser?.userId),
    token,
  });

  const [savedProfile, setSavedProfile] = useState(null);
  const serverProfile = toGarageProfile(garage.profile);

  const profile =
    savedProfile?.token === token &&
    savedProfile?.userId === currentUser?.userId
      ? savedProfile.profile
      : serverProfile;

  const [draftState, setDraftState] = useState(null);
  const draft = draftState ?? profile;

  const setDraft = (value) => {
    setDraftState((previous) =>
      typeof value === "function"
        ? value(previous ?? profile)
        : value,
    );
  };

  const [saving, setSaving] = useState(false);
  const saveControllerRef = useRef(null);

  const teams = garage.teams.map((team) => ({
    name: displayName(team.name),
    drivers: garage.drivers
      .filter((driver) => driver.teamId === team.teamId)
      .map((driver) => displayName(driver.name)),
  }));

  const market = garage.market;
  const stampCount = garage.stamps.watchedCount;
  const totalRaces = garage.stamps.totalRaces;

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
    teams.find((team) => team.name === selectionTeam)
      ?.drivers ?? [];

  const stampNumber = Math.min(
    23,
    Math.max(0, stampCount),
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

  useEffect(() => {
    return () => saveControllerRef.current?.abort();
  }, [token, currentUser?.userId]);

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
    if (garage.loading || saving) return;

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

  async function saveProfile() {
    if (
      !hasChanges ||
      photoLoading ||
      saving ||
      garage.loading
    ) {
      return;
    }

    const nickname = draft.nickname.trim();

    if (nickname.length < 2 || nickname.length > 20) {
      setError("이름은 2~20자로 입력해 주세요.");
      return;
    }

    if (draft.bio.length > 100) {
      setError("소개는 100자 이내로 입력해 주세요.");
      return;
    }

    const controller = new AbortController();
    saveControllerRef.current = controller;

    setSaving(true);
    setError("");

    try {
      const body = createProfilePatch(
        draft,
        profile,
        garage,
      );

      const result = await updateMyGarageProfile(body, {
        token,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const next = toGarageProfile(result);

      if (USE_MOCK) {
        next.avatarSrc = draft.avatarSrc;
      }

      setSavedProfile({
        token,
        userId: currentUser?.userId,
        profile: next,
      });

      setDraft(next);

      // 서버 저장 성공 후 팀 라디오용 공통 캐시 갱신
      try {
        saveGarageProfile(next);
      } catch {
        // 캐시 오류와 서버 저장 결과는 분리합니다.
      }

      setEditing(false);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(
          error.message ||
            "프로필을 저장하지 못했습니다.",
        );
      }
    } finally {
      if (saveControllerRef.current === controller) {
        setSaving(false);
      }
    }
  }

  function changePhoto(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!USE_MOCK) {
      setError(
        "현재 서버는 프로필 사진 업로드를 지원하지 않습니다.",
      );
      return;
    }

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

  if (!currentUser?.userId) {
    return (
      <LoginGuide
        logoSrc={garageLogo}
        logoAlt="My Garage"
        onLogin={onLogin}
      />
    );
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
            disabled={
              !hasChanges ||
              photoLoading ||
              saving ||
              garage.loading
            }
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
          <button
            type="button"
            onClick={() => navigate("/my-garage/radio")}
          >
            마이 라디오
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
          rank={current.teamRank}
          name={current.team}
          editing={editing}
          onChange={() => setSheet("team")}
        />

        <FavoriteCard
          type="driver"
          rank={current.driverRank}
          name={current.driver}
          editing={editing}
          onChange={() => setSheet("driver")}
        />
      </div>

      <section
        className={`${styles.marketCard} ${
          !current.showAssets
            ? styles.privateMarketCard
            : ""
        }`}
      >
        <div className={styles.marketHeader}>
          <h2>MY RACE CART</h2>

          {editing && (
            <div className={styles.privacy}>
              <span>비공개</span>

              <button
                type="button"
                role="switch"
                aria-label="자산 비공개"
                aria-checked={!draft.showAssets}
                className={`${styles.switch} ${
                  !draft.showAssets
                    ? styles.switchOn
                    : ""
                }`}
                onClick={() =>
                  updateDraft(
                    "showAssets",
                    !draft.showAssets,
                  )
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
                {market.totalAssets == null
                  ? "—"
                  : Number(
                      market.totalAssets,
                    ).toLocaleString("ko-KR")}
              </strong>
            </div>

            <div>
              <span>수익률</span>
              <strong className={styles.positive}>
                ▲ {market.returnRate ?? "—"}%
              </strong>
            </div>

            <div>
              <span>유저 랭킹</span>
              <strong>
                #
                {market.rank == null
                  ? "—"
                  : String(market.rank).padStart(
                      3,
                      "0",
                    )}
              </strong>
            </div>
          </div>
        )}
      </section>

      <section
        className={styles.stampCard}
        aria-label={`${totalRaces}개 중 ${stampCount}개 레이스 참여`}
      >
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
              ? teams.map((team) => team.name)
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