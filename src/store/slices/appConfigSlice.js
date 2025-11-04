// redux/slices/appConfigSlice.js
import {createSlice} from '@reduxjs/toolkit';
import CONFIG from './../../constents/config';

const initialState = {
	apiBaseUrl: CONFIG.API_BASE_URL,
	appVersion: CONFIG.APP_VERSION,
};

const appConfigSlice = createSlice({
	name: 'appConfig',
	initialState,
	reducers: {
		setApiBaseUrl: (state, action) => {
			state.apiBaseUrl = action.payload;
		},
	},
});

export const {setApiBaseUrl} = appConfigSlice.actions;
export default appConfigSlice.reducer;
