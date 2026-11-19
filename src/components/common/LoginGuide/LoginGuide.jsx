import loginIllustration from "../../../assets/images/로그인 안내.svg";
import s from "./LoginGuide.module.scss";

export default function LoginGuide({
  logoSrc,
  logoAlt = "",
  onLogin,
}) {
  return (
    <section className={s.page}>
      {logoSrc && (
        <h1 className={s.heading}>
          <img
            className={s.logo}
            src={logoSrc}
            alt={logoAlt}
          />
        </h1>
      )}

      <div className={s.content}>
        <p className={s.message}>
          해당 기능은 로그인 후 이용 가능합니다.
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