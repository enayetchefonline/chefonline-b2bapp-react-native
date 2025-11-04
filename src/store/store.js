// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import appConfigReducer from './slices/appConfigSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    appConfig: appConfigReducer,
    user: userReducer,

    // other slices here
  },
});
