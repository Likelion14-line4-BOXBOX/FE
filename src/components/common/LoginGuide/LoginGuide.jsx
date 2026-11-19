import loginIllustration from "../../../assets/images/로그인 안내.svg";
import s from "./LoginGuide.module.scss";

export default function LoginGuide({
  logoSrc,
  logoAlt = "",
  onLogin,
  showLock = Boolean(logoSrc),
}) {
  return (
    <section className={showLock ? `${s.page} ${s.withLock}` : s.page}>
      {logoSrc && (
        <h1 className={s.heading}>
          <img className={s.logo} src={logoSrc} alt={logoAlt} />
        </h1>
      )}

      <div className={s.content}>
        {showLock && (
          <svg
            className={s.lockIcon}
            width="44"
            height="46"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
          >
            <path
              fill="#727272"
              d="M21.9997 3.66699C16.9452 3.66699 12.833 7.77916 12.833 12.8337V16.5003H10.9997C8.97751 16.5003 7.33301 18.1448 7.33301 20.167V36.667C7.33301 38.6892 8.97751 40.3337 10.9997 40.3337H32.9997C35.0218 40.3337 36.6663 38.6892 36.6663 36.667V20.167C36.6663 18.1448 35.0218 16.5003 32.9997 16.5003H31.1663V12.8337C31.1663 7.77916 27.0542 3.66699 21.9997 3.66699ZM16.4997 12.8337C16.4997 9.80132 18.9673 7.33366 21.9997 7.33366C25.032 7.33366 27.4997 9.80132 27.4997 12.8337V16.5003H16.4997V12.8337ZM33.0033 36.667H23.833V32.4907C24.9238 31.8545 25.6663 30.6848 25.6663 29.3337C25.6663 27.3115 24.0218 25.667 21.9997 25.667C19.9775 25.667 18.333 27.3115 18.333 29.3337C18.333 30.683 19.0755 31.8545 20.1663 32.4907V36.667H10.9997V20.167H32.9997L33.0033 36.667Z"
            />
          </svg>
        )}

        <p className={s.message}>
          {showLock ? (
            <>
              해당 기능은 로그인 후
              <br />
              이용 가능합니다.
            </>
          ) : (
            "해당 기능은 로그인 후 이용 가능합니다."
          )}
        </p>

        <button
          type="button"
          className={s.loginButton}
          onClick={onLogin}
        >
          로그인하기
        </button>

        <img
          className={s.illustration}
          src={loginIllustration}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}