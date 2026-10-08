// أدوات موحّدة لقراءة معاملات القوائم (بحث/ترتيب/ترقيم) من searchParams

export const PAGE_SIZE = 10;

export type RawParams = Record<string, string | string[] | undefined>;

export interface ListParams {
  q: string;
  page: number;
  sort?: string;
  dir: "asc" | "desc";
  raw: Record<string, string | undefined>;
}

export function parseListParams(sp: RawParams, defaultSort?: string): ListParams {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const page = Math.max(1, Number(get("page") || 1) || 1);
  const dir = get("dir") === "asc" ? "asc" : "desc";
  const raw: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    raw[k] = Array.isArray(v) ? v[0] : v;
  }
  return {
    q: (get("q") || "").trim(),
    page,
    sort: get("sort") || defaultSort,
    dir,
    raw,
  };
}
