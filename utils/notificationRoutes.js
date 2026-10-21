const normalizeRoute = (route) => {
    if (!route || typeof route !== 'string') return null;

    if (route.startsWith('/broker/auth/verify-otp')) return '/(auth)/otp-verification';
    if (route.startsWith('/broker/kyc')) return { pathname: '/(screens)/kyc', params: { section: route.split('section=')[1] || '' } };
    if (route.startsWith('/broker/wallet')) return '/(screens)/wallet';
    if (route.startsWith('/broker/clients/')) {
        const id = route.split('/')[3]?.split('?')[0];
        if (id && !id.includes('{{')) return { pathname: '/(screens)/customer-details', params: { id } };
    }
    if (route.startsWith('/broker/clients')) return '/(screens)/customer-requirement';
    if (route.startsWith('/broker/properties')) return '/(tabs)/home';
    if (route.startsWith('/broker/dashboard')) return '/(tabs)/home';
    if (route.startsWith('/broker/visits')) return '/(tabs)/home';
    if (route.startsWith('/broker/deals')) return '/(tabs)/home';
    if (route.startsWith('/broker/commissions')) return '/(screens)/commission-history';

    if (route.startsWith('//') || route.includes('{{')) return null;
    const known = ['/(tabs)/home', '/(screens)/kyc', '/(screens)/wallet', '/(screens)/commission-history', '/(screens)/customer-requirement', '/(screens)/notifications'];
    return known.includes(route) ? route : null;
};

export const resolveNotificationRoute = (metadata = {}) => {
    const data = { ...(metadata?.metadata || {}), ...(metadata || {}) };
    const route = normalizeRoute(data.route || data.deepLink || data.redirect);
    if (route) return route;

    if ((data.client_id || data.clientId) && /CLIENT/.test(data.eventKey || data.event || '')) {
        return { pathname: '/(screens)/customer-details', params: { id: data.client_id || data.clientId } };
    }
    switch (data.action) {
        case 'verify_otp':
            return '/(auth)/otp-verification';
        case 'view_kyc':
        case 'view_kyc_status':
        case 'update_kyc':
            return '/(screens)/kyc';
        case 'view_wallet_transaction':
        case 'view_withdrawal':
        case 'add_bank_details':
            return '/(screens)/wallet';
        case 'view_commission':
            return '/(screens)/commission-history';
        case 'view_client':
        case 'view_client_review':
        case 'review_client':
            return '/(screens)/customer-requirement';
        case 'view_property':
        case 'edit_property':
        case 'edit_property_section':
        case 'view_property_activity':
        case 'view_property_visits':
        case 'view_client_visits':
        case 'view_visit':
        case 'view_deal':
        case 'explore_app':
            return '/(tabs)/home';
        default:
            return '/(screens)/notifications';
    }
};
