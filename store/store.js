import { configureStore } from '@reduxjs/toolkit';
import appSlice from './slices/appSlice';
import authSlice from './slices/authSlice';
import requirementsSlice from './slices/requirementsSlice';
import notificationSlice from './slices/notificationSlice';
import myAddedSlice from './slices/myAddedSlice';
import documentSlice from './slices/documentSlice';
import walletSlice from './slices/walletSlice';
import brokerSlice from './slices/brokerSlice';
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
        inventory: inventorySlice,
        property: propertySlice,
        location: locationSlice,
    },
});
