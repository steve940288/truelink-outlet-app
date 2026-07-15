export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(p) {
  return `${BASE_PATH}${p}`;
}
