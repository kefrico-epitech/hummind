import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Entity } from "../../dto/entity.dto"; // Assure-toi que le chemin est bon

interface OrganisationState {
  data: Entity | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrganisationState = {
  data: null,
  loading: false, // On peut le mettre à true par défaut si on veut charger direct
  error: null,
};

const organisationSlice = createSlice({
  name: "organisation",
  initialState,
  reducers: {
    // Action de début de chargement
    fetchOrganisationStart(state) {
      state.loading = true;
      state.error = null;
      state.data = null; // Optionnel : reset data ou garder l'ancien cache
    },
    // Action de succès
    fetchOrganisationSuccess(state, action: PayloadAction<Entity>) {
      state.loading = false;
      state.data = action.payload;
    },
    // Action d'échec
    fetchOrganisationFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // Action pour reset l'état (utile quand on quitte la page)
    resetOrganisationState(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    }
  },
});

export const { 
  fetchOrganisationStart, 
  fetchOrganisationSuccess, 
  fetchOrganisationFailure,
  resetOrganisationState 
} = organisationSlice.actions;

export default organisationSlice.reducer;