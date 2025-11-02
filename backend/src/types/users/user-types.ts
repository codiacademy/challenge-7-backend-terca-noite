export type CreateUserType = {
    name: string;
    email: string;
    password: string;
}

export type LoginUserType = {
    email: string;
    password: string;
}

export type ProfileChangeType = {
    userId: string;
    name?: string | undefined;
    email?: string | undefined;
    
}