import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import orgReducer from "./slices/organisationSlice";
import uiReducer from "./slices/uiSlice";
import courseReducer from "./slices/courseSlice";
import courseSetupReducer from "./slices/courseSetupSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  user: userReducer,
  org: orgReducer,
  course: courseReducer,
  courseSetup: courseSetupReducer,

});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export const store = makeStore();
export type AppStore = ReturnType<typeof makeStore>;

export type AppDispatch = typeof store.dispatch;
