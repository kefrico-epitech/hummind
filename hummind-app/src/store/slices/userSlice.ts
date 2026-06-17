import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Platform-level role exposed by the backend as `user.role`.
// Mirrors the backend enum PlatformRole.
export type UserRole = "ROOT" | "MEMBER" | null;

export interface UserInfo {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: UserRole;
}

interface AuthState {
    user: UserInfo | null;
}

const initialState: AuthState = {
    user: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<UserInfo | null>) {
            state.user = action.payload;
        },
        clear(state) {
            state.user = null;
        },
    },
});

export const { setUser, clear } = userSlice.actions;
export default userSlice.reducer;