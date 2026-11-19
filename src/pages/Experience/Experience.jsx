import { useRef, useState } from "react";
import illustration from "../../assets/images/로그인 안내.svg";
import styles from "./Experience.module.scss";

export default function Experience({ onMember, onGuest }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enterMember() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await onMember();
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.page} aria-labelledby="experience-title">
      <h1 id="experience-title">체험 방식을 선택해주세요</h1>
      <div className={styles.options}>
        <button type="button" disabled={busy} onClick={onGuest}>
          <strong>비회원</strong>
          <span>일부 기능 조회 가능</span>
        </button>
        <button type="button" className={styles.member} disabled={busy} onClick={enterMember}>
          <strong>{busy ? "로그인 중…" : "회원으로 체험"}</strong>
          <span>모든 기능 이용 가능</span>
        </button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.road} aria-hidden="true" />
      <img className={styles.car} src={illustration} alt="" aria-hidden="true" />
    </section>
  );
}
