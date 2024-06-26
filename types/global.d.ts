declare global {
  interface Window {
    jdenticon: {
      update: (el: HTMLElement, hashOrValue: string) => void;
    };
  }
}

export {};
