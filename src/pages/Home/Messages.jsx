import { Link } from "react-router-dom";
import styles from "./Messages.module.scss";

export default function Messages() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Link
          to="/"
          className={styles.iconButton}
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14.4167 5L8 11.4167L14.4167 17.8333"
              strokeWidth="1.65"
              stroke="#111111"
            />
          </svg>
        </Link>

        <h1>메시지</h1>

        <span
          className={styles.iconButton}
          aria-hidden="true"
        />
      </header>

      <div className={styles.empty}>
        <p>아직 메시지가 없습니다.</p>
      </div>
    </section>
  );
}