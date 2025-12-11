export type BuilderSpace = {
  logo: string;
  href: string;
  alt: string;
};

export type BuilderUser = {
  name: string;
  email: string;
  avatar: string;
};

export type BuilderNavMain = {
  type: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  isActive?: boolean | false;
};

export type BuilderCtxData = {
  space: BuilderSpace | null;
  user: BuilderUser | null;
  navMain: BuilderNavMain[] | [];
};
