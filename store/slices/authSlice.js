import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';

const fetchWithTimeout = (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
};

const getKycStatus = (kyc) => String(
    kyc?.status || kyc?.kyc_status || kyc?.verification_status || kyc?.approval_status || ''
).toLowerCase();

const hasUploadedKycDocuments = (kyc) => Boolean(
    kyc?.aadhar_front_url
    || kyc?.aadhar_back_url
    || kyc?.pan_card_url
    || kyc?.profile_photo_url
    || (Array.isArray(kyc?.documents) && kyc.documents.length > 0)
);

const isKycSubmittedOrApproved = (kyc) => {
    if (!kyc) return false;

    const status = getKycStatus(kyc);
    if (['rejected', 'declined', 'failed'].includes(status)) return false;
    if (['pending', 'submitted', 'approved', 'verified', 'in_review', 'under_review'].includes(status)) return true;

    return hasUploadedKycDocuments(kyc);
};

// Load token from storage on app start
export const loadToken = createAsyncThunk('auth/loadToken', async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return token;
});

// Async Thunks
export const startLogin = createAsyncThunk(
    'auth/startLogin',
    async ({ phone }, { rejectWithValue }) => {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, purpose: 'login', role: 'broker' }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 400 && data.message === 'No account found with this phone number') {
                    return { needsRegistration: true };
                }
                return rejectWithValue(data.message);
            }
            return { ...data, needsRegistration: false };
        } catch (err) { return rejectWithValue(err.name === 'AbortError' ? 'Request timed out. Please check your connection and try again.' : err.message); }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified_token: credentials.verified_token, role: 'broker' }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    verified_token: userData.verified_token,
                    first_name: userData.first_name,
                    last_name: userData.last_name || '',
                    role: 'broker'
                }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const sendOtpApi = createAsyncThunk(
    'auth/sendOtpApi',
    async ({ phone, purpose }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, purpose, role: 'broker' }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data; 
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const verifyOtpApi = createAsyncThunk(
    'auth/verifyOtpApi',
    async ({ otp_token, otp }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp_token, otp }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data; // returns { verified, verified_token }
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const uploadKyc = createAsyncThunk(
    'auth/uploadKyc',
    async (payload = {}, { getState, rejectWithValue }) => {
        try {
            const { aadharFront, aadharBack, panCard, profilePhoto, aadharNumber, panNumber } = payload;
            const token = getState().auth.token;
            const existingKyc = getState().auth.kyc;
            const method = existingKyc ? 'PATCH' : 'POST';
            console.log('[uploadKyc] token:', token ? token.substring(0, 20) + '...' : 'NULL');
            console.log('[uploadKyc] method:', method, '| existingKyc:', !!existingKyc);
            console.log('[uploadKyc] payload:', JSON.stringify({
                hasAadharFront: !!aadharFront,
                hasAadharBack: !!aadharBack,
                hasPanCard: !!panCard,
                hasProfilePhoto: !!profilePhoto,
                aadharNumber,
                panNumber
            }));

            const formData = new FormData();
            const toFile = (asset, name) => ({
                uri: asset.uri,
                name: asset.fileName || `${name}.jpg`,
                type: asset.mimeType || 'image/jpeg',
            });
            
            // Only append files if they exist and are not null
            if (profilePhoto && profilePhoto.uri) {
                console.log('[uploadKyc] appending profile_photo');
                formData.append('profile_photo', toFile(profilePhoto, 'profile_photo'));
            }
            if (aadharFront && aadharFront.uri) {
                console.log('[uploadKyc] appending aadhar_front');
                formData.append('aadhar_front', toFile(aadharFront, 'aadhar_front'));
            }
            if (aadharBack && aadharBack.uri) {
                console.log('[uploadKyc] appending aadhar_back');
                formData.append('aadhar_back', toFile(aadharBack, 'aadhar_back'));
            }
            if (panCard && panCard.uri) {
                console.log('[uploadKyc] appending pan_card');
                formData.append('pan_card', toFile(panCard, 'pan_card'));
            }
            
         
            const aadharNum = (aadharNumber && typeof aadharNumber === 'string') ? aadharNumber.trim() : '';
            const panNum = (panNumber && typeof panNumber === 'string') ? panNumber.trim() : '';
            
            console.log('[uploadKyc] appending aadhar_number:', aadharNum || '(empty)');
            console.log('[uploadKyc] appending pan_number:', panNum || '(empty)');
            formData.append('aadhar_number', aadharNum);
            formData.append('pan_number', panNum);
            
            console.log('[uploadKyc] making request to:', `${API_BASE_URL}/api/v1/broker/kyc`);
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/kyc`, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            console.log('[uploadKyc] response status:', response.status);
            console.log('[uploadKyc] response data:', JSON.stringify(data));
            if (!response.ok) return rejectWithValue(data.message);
            return data;
        } catch (err) {
            console.log('[uploadKyc] caught error:', err.message);
            return rejectWithValue(err.message);
        }
    }
);

export const fetchKyc = createAsyncThunk(
    'auth/fetchKyc',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/broker/kyc`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 404) return null;
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Fetch user profile
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateProfilePicture = createAsyncThunk(
    'auth/updateProfilePicture',
    async (asset, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const formData = new FormData();
            formData.append('profilePicture', { uri: asset.uri, name: asset.fileName || 'profile.webp', type: asset.mimeType || 'image/jpeg' });
            const response = await fetch(`${API_BASE_URL}/api/v1/profile/me/profile-picture`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: formData });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.data;
        } catch (err) { return rejectWithValue(err.message); }
    }
);

// Change password
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/profile/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data.message);
            return data.message;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Delete account
export const deleteAccount = createAsyncThunk(
    'auth/deleteAccount',
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) return rejectWithValue(data.message || 'Failed to delete account');
            dispatch(logout());
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        name: '',
        mobile: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
        profileImage: null,
        otp: ['', '', '', '', '', ''], // Changed to 6 digits as per backend swagger
        otpFlow: 'register',
        rememberMe: false,
        isLoggedIn: false,
        authChecked: false,
        isKycCompleted: false,
        token: null,
        user: null,
        loading: false,
        error: null,
        otpToken: null,
        verifiedToken: null,
        kyc: null,
        kycLoading: false,
        kycChecked: false,
        kycCheckFailed: false,
    },
    reducers: {
        setName: (state, action) => { state.name = action.payload; },
        setMobile: (state, action) => { state.mobile = action.payload; },
        setPassword: (state, action) => { state.password = action.payload; },
        setNewPassword: (state, action) => { state.newPassword = action.payload; },
        setConfirmPassword: (state, action) => { state.confirmPassword = action.payload; },
        setProfileImage: (state, action) => { state.profileImage = action.payload; },
        clearProfileImage: (state) => { state.profileImage = null; },
        setOtpDigit: (state, action) => {
            const { index, value } = action.payload;
            state.otp[index] = value;
        },
        clearOtp: (state) => { state.otp = ['', '', '', '', '', '']; },
        setOtpFlow: (state, action) => { state.otpFlow = action.payload; },
        toggleRememberMe: (state) => { state.rememberMe = !state.rememberMe; },
        setLoggedIn: (state, action) => { state.isLoggedIn = action.payload; },
        setKycCompleted: (state, action) => { state.isKycCompleted = action.payload; },
        clearError: (state) => { state.error = null; },
        logout: (state) => {
            state.mobile = '';
        state.password = '';
            state.profileImage = null;
            state.isLoggedIn = false;
            state.isKycCompleted = false;
            state.token = null;
            state.user = null;
            state.kyc = null;
            state.kycLoading = false;
            state.kycChecked = false;
            state.kycCheckFailed = false;
            state.authChecked = true;
            AsyncStorage.removeItem('auth_token');
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.kyc = null;
                state.kycChecked = false;
                state.kycCheckFailed = false;
            })
            .addCase(startLogin.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(startLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.otpFlow = action.payload.needsRegistration ? 'register' : 'login';
                state.otpToken = action.payload.otp_token || null;
            })
            .addCase(startLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.isKycCompleted = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                AsyncStorage.setItem('auth_token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                // Registration successful, usually wait for login or auto-login
                state.user = action.payload.user;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Send OTP
            .addCase(sendOtpApi.fulfilled, (state, action) => {
                state.otpToken = action.payload.otp_token;
            })
            // Verify OTP
            .addCase(verifyOtpApi.fulfilled, (state, action) => {
                state.verifiedToken = action.payload.verified_token;
            })
            // Load token
            .addCase(loadToken.fulfilled, (state, action) => {
                state.authChecked = true;
                if (action.payload) {
                    state.token = action.payload;
                    state.isLoggedIn = true;
                    state.kycChecked = false;
                    state.kycCheckFailed = false;
                }
            })
            .addCase(loadToken.rejected, (state) => {
                state.authChecked = true;
            })
            .addCase(uploadKyc.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(uploadKyc.fulfilled, (state, action) => {
                const uploadedKyc = action.payload?.data || action.payload;
                state.loading = false;
                state.kyc = uploadedKyc || state.kyc;
                state.isKycCompleted = true;
                state.kycChecked = true;
            })
            .addCase(uploadKyc.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Fetch KYC
            .addCase(fetchKyc.pending, (state) => {
                state.kycLoading = true;
                state.kycCheckFailed = false;
                state.error = null;
            })
            .addCase(fetchKyc.fulfilled, (state, action) => {
                state.kycLoading = false;
                state.kycChecked = true;
                state.kycCheckFailed = false;
                state.kyc = action.payload;
                state.isKycCompleted = isKycSubmittedOrApproved(action.payload);
            })
            .addCase(fetchKyc.rejected, (state, action) => {
                state.kycLoading = false;
                state.kycChecked = true;
                state.kycCheckFailed = true;
                state.error = action.payload;
            })
            // Fetch Profile
            .addCase(fetchUserProfile.pending, (state) => { state.loading = true; })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user || action.payload;
                const profilePictureUrl = action.payload.user?.profilePictureUrl || action.payload.profilePictureUrl;
                if (state.user && profilePictureUrl) state.user.avatar_url = profilePictureUrl;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateProfilePicture.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateProfilePicture.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) state.user.avatar_url = action.payload?.profilePictureUrl || action.payload?.avatar_url || state.user.avatar_url;
            })
            .addCase(updateProfilePicture.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Change Password
            .addCase(changePassword.pending, (state) => { state.loading = true; })
            .addCase(changePassword.fulfilled, (state) => { state.loading = false; })
            .addCase(changePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { 
    setName, setMobile, setPassword, setNewPassword, 
    setConfirmPassword, setProfileImage, clearProfileImage, 
    setOtpDigit, clearOtp, setOtpFlow, toggleRememberMe, 
    setLoggedIn, setKycCompleted, logout, clearError 
} = authSlice.actions;

export default authSlice.reducer;
