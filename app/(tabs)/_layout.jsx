import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import House from "lucide-react-native/icons/house";
import Bookmark from "lucide-react-native/icons/bookmark";
import UserRound from "lucide-react-native/icons/user-round";
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
    settings: UserRound,
};

function TabIcon({ name, focused }) {
    const iconColor = focused ? TAB_COLOR : MUTED_TAB_COLOR;

    if (name === "discount") {
        return (
            <MaterialCommunityIcons name="sale-outline" size={29} color={iconColor} />
        );
    }

    const Icon = tabIcons[name];
    if (!Icon) return null;
    return <Icon size={27} color={iconColor} stroke={iconColor} strokeWidth={1.7} />;
}

function AddTabIcon() {
    return (
        <View
            pointerEvents="none"
            style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: TAB_COLOR,
                transform: [{ translateY: -20 }],
                shadowColor: TAB_COLOR,
                shadowOffset: { width: 0, height: 7 },
                shadowOpacity: 0.32,
                shadowRadius: 8,
                elevation: 12,
            }}
        >
            <MaterialCommunityIcons name="plus" size={42} color="#FFFFFF" />
        </View>
    );
}

export default function TabsLayout() {
    const router = useRouter();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0;
    const iosBottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom - 8, 6) : 8;
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
                        paddingTop: 14,
                    },
                    tabBarStyle: {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -1,
                        borderTopRightRadius: 45,
                        borderTopLeftRadius: 45,
                        borderTopColor: "transparent",
                        backgroundColor: "#fff",
                        paddingTop: 8,
                        paddingHorizontal: 12,
                        paddingBottom: Platform.OS === "ios" ? iosBottomPadding : Math.max(androidBottomInset, 0),
                        height: Platform.OS === "ios" ? 86 : 76 + androidBottomInset,
                        ...Platform.select({
                            ios: {
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
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
                                    hitSlop={{ top: 22, right: 8, bottom: 8, left: 8 }}
                                    style={({ pressed }) => [
                                        style,
                                        {
                                           bottom: 34,
                                            height: 68,
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
                        tabBarLabel: "Profile",
                        tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
                    }}
                />
            </Tabs>
            <KycModal />
        </>
    );
}
