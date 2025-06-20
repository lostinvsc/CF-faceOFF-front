import { atom } from 'recoil';

const localStorageEffect = (key: string) => ({setSelf, onSet}: any) => {
  const savedValue = localStorage.getItem(key)
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }

  onSet((newValue: any) => {
    if (newValue === '') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

export const userHandleState = atom({
  key: 'userHandleState',
  default: '',
  effects: [
    localStorageEffect('userHandle')
  ]
});