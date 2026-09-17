import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import House from "lucide-react-native/icons/house";
import Bookmark from "lucide-react-native/icons/bookmark";
import Settings from "lucide-react-native/icons/settings";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import KycModal from "../../components/KycModal";
import { clearCurrentItem } from "../../store/slices/myAddedSlice";
import { resetProject } from "../../store/slices/projectSlice";

const TAB_COLOR = "#4A43EC";
const MUTED_TAB_COLOR = "#62676B";

const tabIcons = {
    home: House,
    favourite: Bookmark,
    settings: Settings,
};

function TabIcon({ name, focused }) {
    const iconColor = focused ? TAB_COLOR : MUTED_TAB_COLOR;

    if (name === "discount") {
        return (
            <MaterialCommunityIcons name="sale-outline" size={25} color={iconColor} />
        );
    }

    const Icon = tabIcons[name];
    if (!Icon) return null;
    return <Icon size={24} color={iconColor} stroke={iconColor} strokeWidth={1.8} />;
}

function AddTabIcon() {
    return (
        <View
            pointerEvents="none"
            style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: TAB_COLOR,
                transform: [{ translateY: -16 }],
                shadowColor: TAB_COLOR,
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 10,
            }}
        >
            <MaterialCommunityIcons name="plus" size={34} color="#FFFFFF" />
        </View>
    );
}

export default function TabsLayout() {
    const router = useRouter();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0;
    const iosBottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom - 8, 4) : 6;
    const openFreshAddProject = () => {
        dispatch(resetProject());
        dispatch(clearCurrentItem());
        router.replace(`/(tabs)/addProject?mode=add&itemId=&itemType=&fresh=${Date.now()}`);
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: TAB_COLOR,
                    tabBarInactiveTintColor: MUTED_TAB_COLOR,
                    tabBarItemStyle: {
                        paddingTop: 10,
                    },
                    tabBarStyle: {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -1,
                        borderTopRightRadius: 38,
                        borderTopLeftRadius: 38,
                        borderTopColor: "transparent",
                        backgroundColor: "#fff",
                        paddingTop: 4,
                        paddingHorizontal: 8,
                        paddingBottom: Platform.OS === "ios" ? iosBottomPadding : Math.max(androidBottomInset, 0),
                        height: Platform.OS === "ios" ? 76 : 66 + androidBottomInset,
                        ...Platform.select({
                            ios: {
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.18,
                                shadowRadius: 4,
                            },
                            android: {
                                elevation: 10,
                            },
                        }),
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        headerShown: false,
                        tabBarLabel: "Home",
                        tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="favourite"
                    options={{
                        headerShown: false,
                        tabBarLabel: "My Added",
                        tabBarIcon: ({ focused }) => <TabIcon name="favourite" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="addProject"
                    options={{
                        headerShown: false,
                        tabBarLabel: "Add",
                        tabBarIcon: () => null,
                        tabBarButton: (props) => {
                            const { style, children: _children, ...pressableProps } = props;
                            return (
                              <Pressable
                                    {...pressableProps}
                                    onPress={openFreshAddProject}
                                    hitSlop={{ top: 16, right: 8, bottom: 8, left: 8 }}
                                    style={({ pressed }) => [
                                        style,
                                        {
                                            bottom: 28,
                                            height: 58,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: pressed ? 0.88 : 1,
                                            overflow: "visible",
                                            zIndex: 20,
                                        },
                                    ]}
                                >
                                    <AddTabIcon />
                                </Pressable>
                            );
                        },
                    }}
                />
                <Tabs.Screen
                    name="discount"
                    options={{
                        headerShown: false,
                        tabBarLabel: "Commission",
                        tabBarIcon: ({ focused }) => <TabIcon name="discount" focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        headerShown: false,
                        tabBarLabel: "Settings",
                        tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
                    }}
                />
            </Tabs>
            <KycModal />
        </>
    );
}
