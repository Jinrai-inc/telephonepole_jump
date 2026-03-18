/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
  Payjp: (key: string, options?: { threeDSecureWorkflow?: "subwindow" | "redirect" }) => {
    elements: () => {
      create: (type: string, options?: any) => {
        mount: (element: HTMLElement) => void;
        unmount: () => void;
      };
    };
    createToken: (
      card: any,
      data?: {
        three_d_secure?: boolean;
        card?: {
          name?: string;
          email?: string;
          phone?: string;
        };
      }
    ) => Promise<{ id?: string; error?: { message: string } }>;
  };
}
