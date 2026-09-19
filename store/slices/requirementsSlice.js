import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';

// Async Thunks
export const fetchRequirements = createAsyncThunk(
    'requirements/fetchRequirements',
    async ({ search = '', page = 1, limit = 10 }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token; // Assuming token exists in auth slice
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer?search=${search}&page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchRequirementById = createAsyncThunk(
    'requirements/fetchRequirementById',
    async (id, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchRequirementTimeline = createAsyncThunk(
    'requirements/fetchRequirementTimeline',
    async (id, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer/${id}/timeline`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const createRequirement = createAsyncThunk(
    'requirements/createRequirement',
    async (payload, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateRequirementApi = createAsyncThunk(
    'requirements/updateRequirementApi',
    async ({ id, payload }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteRequirementApi = createAsyncThunk(
    'requirements/deleteRequirementApi',
    async (id, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/customer/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return id;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Customer Contact OTP Verification
export const sendCustomerOtp = createAsyncThunk(
    'requirements/sendCustomerOtp',
    async ({ phone }, { rejectWithValue }) => {
        try {
            const formattedPhone = phone?.startsWith('+91') ? phone : `+91${String(phone || '').replace(/\D/g, '')}`;
            console.log('📤 [sendCustomerOtp] Sending OTP to:', formattedPhone);
            console.log('📤 [sendCustomerOtp] API URL:', `${API_BASE_URL}/auth/send-otp`);
            
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    phone: formattedPhone, 
                    purpose: 'owner_contact',
                    role: 'broker'
                }),
            });
            
            const data = await response.json();
            console.log('📥 [sendCustomerOtp] Response status:', response.status);
            console.log('📥 [sendCustomerOtp] Response data:', data);
            
            if (!response.ok) {
                console.error('❌ [sendCustomerOtp] Error:', data.message);
                return rejectWithValue(data.message);
            }
            
            console.log('✅ [sendCustomerOtp] Success');
            return data;
        } catch (err) {
            console.error('❌ [sendCustomerOtp] Exception:', err.message);
            return rejectWithValue(err.message);
        }
    }
);

export const verifyCustomerOtp = createAsyncThunk(
    'requirements/verifyCustomerOtp',
    async ({ otp_token, otp }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp_token, otp }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const requirementsSlice = createSlice({
    name: 'requirements',
    initialState: {
        list: [],
        currentRequirement: null,
        timeline: [],
        timelineLoading: false,
        timelineError: null,
        loading: false,
        error: null,
        isContactVerified: false,
        customerOtpToken: null,
        customerVerifiedToken: null,
        otpLoading: false,
        otpError: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        },
    },
    reducers: {
        setContactVerified: (state, action) => {
            state.isContactVerified = action.payload;
        },
        clearCustomerOtpState: (state) => {
            state.customerOtpToken = null;
            state.customerVerifiedToken = null;
            state.isContactVerified = false;
            state.otpError = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch List
            .addCase(fetchRequirements.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRequirements.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchRequirements.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch By Id
            .addCase(fetchRequirementById.fulfilled, (state, action) => {
                state.currentRequirement = action.payload;
            })
            .addCase(fetchRequirementTimeline.pending, (state) => {
                state.timelineLoading = true;
                state.timelineError = null;
                state.timeline = [];
            })
            .addCase(fetchRequirementTimeline.fulfilled, (state, action) => {
                state.timelineLoading = false;
                state.timeline = action.payload;
            })
            .addCase(fetchRequirementTimeline.rejected, (state, action) => {
                state.timelineLoading = false;
                state.timelineError = action.payload;
            })
            // Create
            .addCase(createRequirement.fulfilled, (state, action) => {
                state.list.unshift(action.payload);
            })
            // Update
            .addCase(updateRequirementApi.fulfilled, (state, action) => {
                const index = state.list.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
                if (state.currentRequirement?.id === action.payload.id) {
                    state.currentRequirement = action.payload;
                }
            })
            // Delete
            .addCase(deleteRequirementApi.fulfilled, (state, action) => {
                state.list = state.list.filter(item => item.id !== action.payload);
            })
            // Send Customer OTP
            .addCase(sendCustomerOtp.pending, (state) => {
                state.otpLoading = true;
                state.otpError = null;
            })
            .addCase(sendCustomerOtp.fulfilled, (state, action) => {
                state.otpLoading = false;
                state.customerOtpToken = action.payload.otp_token;
            })
            .addCase(sendCustomerOtp.rejected, (state, action) => {
                state.otpLoading = false;
                state.otpError = action.payload;
            })
            // Verify Customer OTP
            .addCase(verifyCustomerOtp.pending, (state) => {
                state.otpLoading = true;
                state.otpError = null;
            })
            .addCase(verifyCustomerOtp.fulfilled, (state, action) => {
                state.otpLoading = false;
                state.isContactVerified = true;
                state.customerVerifiedToken = action.payload.verified_token;
            })
            .addCase(verifyCustomerOtp.rejected, (state, action) => {
                state.otpLoading = false;
                state.otpError = action.payload;
                state.isContactVerified = false;
            });
    },
});

export const { setContactVerified, clearCustomerOtpState, clearError } = requirementsSlice.actions;
export default requirementsSlice.reducer;
