/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
  Payjp: (key: string) => {
    elements: () => {
      create: (type: string, options?: any) => {
        mount: (element: HTMLElement) => void;
        unmount: () => void;
      };
    };
    createToken: (card: any) => Promise<{ id?: string; error?: { message: string } }>;
  };
}
