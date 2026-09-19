import { Redirect } from "expo-router";
import { useSelector } from "react-redux";

export default function Index() {
    const token = useSelector((state) => state.auth?.token);
    const authChecked = useSelector((state) => state.auth?.authChecked);
    const isLoggedIn = !!token;

    if (!authChecked) return null;

    if (isLoggedIn) {
        return <Redirect href="/(tabs)/home" />;
    }
    return <Redirect href="/(auth)/login" />;
}
