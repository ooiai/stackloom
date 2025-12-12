export type Outline = {
  id: string;
  pid: string | null;
  name: string;
  type: string;
  children?: Outline[];
};

export type PageConfig = {
  id: string;
  name: string;
  updatedAt: string;
  outline: Outline[];
};
