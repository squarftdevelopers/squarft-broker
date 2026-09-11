import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import authSlice from './slices/authSlice';
import requirementsSlice from './slices/requirementsSlice';
import notificationSlice from './slices/notificationSlice';
import myAddedSlice from './slices/myAddedSlice';
import documentSlice from './slices/documentSlice';
import walletSlice from './slices/walletSlice';
import brokerSlice from './slices/brokerSlice';
import projectSlice from './slices/projectFormSlice';
import projectsSlice from './slices/projectsSlice';
import inventorySlice from './slices/inventorySlice';
import propertySlice from './slices/propertySlice';
import locationSlice from './slices/locationSlice';

export const store = configureStore({
    reducer: {
        app: appSlice,
        auth: authSlice,
        requirements: requirementsSlice,
        notifications: notificationSlice,
        myAdded: myAddedSlice,
        documents: documentSlice,
        wallet: walletSlice,
        broker: brokerSlice,
        project: projectSlice,
        projects: projectsSlice,
        inventory: inventorySlice,
        property: propertySlice,
        location: locationSlice,
    },
});
