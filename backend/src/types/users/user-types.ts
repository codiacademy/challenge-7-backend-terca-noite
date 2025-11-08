export type CreateUserType = {
  fullName: string;
  email: string;
  telephone?: string | undefined;
  password: string;
};

export type LoginUserType = {
  email: string;
  password: string;
};

export type ProfileChangeType = {
  userId: string;
  name?: string | undefined;
  email?: string | undefined;
  telephone?: string | undefined;
};
