import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CourseCreationMode } from "../../components/course/types";

export type CourseSetupState = {
  mode: CourseCreationMode | null;
  title: string;
  domain: string;
  level: string;
  style: string;
  description: string;
  objectives: string[];
  extractedData?: string;
};

const initialState: CourseSetupState = {
  mode: null,
  title: "",
  domain: "",
  level: "",
  style: "",
  description: "",
  objectives: [],
  extractedData: undefined,
};

const courseSetupSlice = createSlice({
  name: "courseSetup",
  initialState,
  reducers: {
    updateCourseSetup(state, action: PayloadAction<Partial<CourseSetupState>>) {
      return { ...state, ...action.payload };
    },
    resetCourseSetup() {
      return initialState;
    },
  },
});

export const { updateCourseSetup, resetCourseSetup } = courseSetupSlice.actions;
export default courseSetupSlice.reducer;
