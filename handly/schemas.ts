`
--------------------------------------------
THIS FILE AUTOMATIC GENERATE, PLEASE DON'T TOUCH
--------------------------------------------
`;

export class Users {
  id!: number;
  username!: string;
  email?: string;
  password!: string;
  updatedAt?: string;
  createdAt?: string;
  isActive!: boolean;
}

export class Posts {
  id!: number;
  updatedAt?: string;
  createdAt?: string;
  isActive!: boolean;
  author!: number;
  subAuthor!: number;
}
