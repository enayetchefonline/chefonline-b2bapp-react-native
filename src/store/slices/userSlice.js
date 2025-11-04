// store/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  userInfo: null, // full UserDetails from login
  activeRestaurant: null, // { restaurant_id, restaurant_name, logo, ... }
  pin: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action) {
      state.isLoggedIn = true;
      state.userInfo = action.payload;

      // If API gives a default rest_id or exactly one assigned restaurant, auto-select
      const list = action.payload?.assign_restaurants ?? [];
      if (list.length === 1) {
        state.activeRestaurant = list[0];
      } else if (!state.activeRestaurant && action.payload?.rest_id) {
        state.activeRestaurant = {
          restaurant_id: action.payload.rest_id,
          restaurant_name: action.payload.restaurant_name,
          logo: action.payload.logo,
        };
      }
    },
    logout(state) {
      state.isLoggedIn = false;
      state.userInfo = null;
      state.activeRestaurant = null;
      state.pin = null;
    },
    setPinCode(state, action) {
      state.pin = action.payload || null;
    },
    setActiveRestaurant(state, action) {
      state.activeRestaurant = action.payload || null;
    },
    // optional: restore from AsyncStorage on app start
    hydrateFromStorage(state, action) {
      const { userInfo, activeRestaurant, pin } = action.payload || {};
      if (userInfo) {
        state.userInfo = userInfo;
        state.isLoggedIn = true;
      }
      if (activeRestaurant) state.activeRestaurant = activeRestaurant;
      if (pin !== undefined) state.pin = pin;
    },
  },
});

export const { login, logout, setPinCode, setActiveRestaurant, hydrateFromStorage } =
  userSlice.actions;

export default userSlice.reducer;

// --------- handy selectors ---------
export const selectIsLoggedIn = (s) => s.user.isLoggedIn;
export const selectUserInfo = (s) => s.user.userInfo;
export const selectAssignRestaurants = (s) => s.user.userInfo?.assign_restaurants || [];
export const selectActiveRestaurant = (s) => s.user.activeRestaurant;
export const selectRestId = (s) =>
  s.user.activeRestaurant?.restaurant_id || s.user.userInfo?.rest_id || null;
