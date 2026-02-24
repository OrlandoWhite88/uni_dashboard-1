/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-router-dom' {
  export function useNavigate(): (path: string, options?: Record<string, unknown>) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: unknown };
  export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void];
  export function Link(props: Record<string, unknown>): JSX.Element;
  export function BrowserRouter(props: Record<string, unknown>): JSX.Element;
  export function Routes(props: Record<string, unknown>): JSX.Element;
  export function Route(props: Record<string, unknown>): JSX.Element;
  export function Navigate(props: Record<string, unknown>): JSX.Element;
}
