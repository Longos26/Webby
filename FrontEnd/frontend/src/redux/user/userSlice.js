// src/redux/user/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,   // { id, email, username, first_name, last_name, role }
  token: null,
  loading: false,
  error: null,
  authChecked: false,  // true once /me has been attempted on boot
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    signInStart: (state) => { state.loading = true; state.error = null; },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      state.authChecked = true;
    },
    signInFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    authCheckComplete: (state) => { state.authChecked = true; },
    signOut: (state) => {
      state.currentUser = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.authChecked = true;
    },
    updateUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
  },
});

export const {
  signInStart, signInSuccess, signInFailure,
  signOut, updateUser, authCheckComplete,
} = userSlice.actions;
export default userSlice.reducer;