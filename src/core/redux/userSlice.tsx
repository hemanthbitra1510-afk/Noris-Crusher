// core/redux/userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  userData: any | null;
  loading: boolean;
  error: string | null;
}
const initialState: UserState = {
  userData: JSON.parse(sessionStorage.getItem("userData") || "null"),
  loading: false,
  error: null,
};
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `https://norisapi.noris.in/Crusher/Login.php?UserID=${username}&Password=${password}`,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.userData = null;
      sessionStorage.removeItem("userData");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload;
        sessionStorage.setItem("userData", JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const { logout } = userSlice.actions;
export default userSlice.reducer;
