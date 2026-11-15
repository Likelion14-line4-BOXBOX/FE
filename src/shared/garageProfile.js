import { useSyncExternalStore } from 'react';

export const INITIAL_PROFILE = {
  nickname: '해머타임기원',
  bio: '해밀턴 8챔 보기 전엔 못 죽음',
  team: '페라리',
  driver: '루이스 해밀턴',
  showAssets: true,
  avatarSrc: '',
};

const STORAGE_KEY = 'boxbox.garage.profile.v1';

let cachedRaw;
let cachedProfile = INITIAL_PROFILE;

export function getGarageProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw !== cachedRaw) {
      const saved = raw ? JSON.parse(raw) : {};

      cachedRaw = raw;
      cachedProfile = {
        ...INITIAL_PROFILE,
        ...saved,
      };
    }
  } catch {
    // 저장소 접근이 불가능하면 현재 메모리의 값을 사용합니다.
  }

  return cachedProfile;
}

export function saveGarageProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('garage-profile-change'));
}

function subscribe(listener) {
  window.addEventListener('storage', listener);
  window.addEventListener('garage-profile-change', listener);

  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('garage-profile-change', listener);
  };
}

export function useGarageProfile() {
  return useSyncExternalStore(
    subscribe,
    getGarageProfile,
    () => INITIAL_PROFILE,
  );
}