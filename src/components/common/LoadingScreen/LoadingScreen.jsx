import hamilton from "../../../assets/images/loading-hamilton.svg";

import styles from "./LoadingScreen.module.scss";

export default function LoadingScreen() {
  return (
    <div
    className={`content pageShadow ${styles.screen}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
    >
      <div className={styles.message}>
        <h1 className={styles.title}>Sorry...</h1>

        <p className={styles.description}>
          잠시만 기다려주세요
        </p>
      </div>

      <img
        src={hamilton}
        alt=""
        aria-hidden="true"
        className={styles.hamilton}
        draggable={false}
      />
    </div>
  );
}