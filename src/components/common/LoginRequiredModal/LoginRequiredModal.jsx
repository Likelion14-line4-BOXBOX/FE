import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import s from './LoginRequiredModal.module.scss';

export default function LoginRequiredModal({
  onClose,
  onLogin,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby="login-required-title"
      aria-describedby="login-required-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <h2 id="login-required-title">
        로그인 필요
      </h2>

      <p id="login-required-description">
        해당 기능은 로그인 후 이용 가능합니다.
      </p>

      <div className={s.actions}>
        <button
          type="button"
          className={s.backButton}
          onClick={onClose}
        >
          뒤로가기
        </button>

        <button
          type="button"
          className={s.loginButton}
          onClick={onLogin}
        >
          로그인하기
        </button>
      </div>
    </dialog>,
    document.body,
  );
}