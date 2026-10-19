// Automatic JSX runtime on top of React.createElement (UMD builds ship no jsx-runtime).
const R = window.React;
export const Fragment = R.Fragment;
export function jsx(type, props, key) {
  return R.createElement(type, key === undefined ? props : { ...props, key });
}
export function jsxs(type, props, key) {
  const { children, ...rest } = props;
  if (key !== undefined) rest.key = key;
  return R.createElement(type, rest, ...children);
}
export const jsxDEV = jsx;
