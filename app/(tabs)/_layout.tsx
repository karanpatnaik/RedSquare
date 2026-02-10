import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, spacing, typography } from "../../styles/tokens";

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/");
      } else {
        setChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!checked) return null;

  return (
    <Tabs
      initialRouteName="bulletin"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
          paddingTop: spacing.xxs,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
          height: 65 + (insets.bottom > 0 ? insets.bottom - spacing.md : 0),
        },
        tabBarLabelStyle: {
          fontFamily: typography.fonts.medium,
          fontSize: typography.sizes.xs,
        },
      }}
    >
      <Tabs.Screen
        name="bulletin"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Feather name="bookmark" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="createPost"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name="plus-circle"
              size={focused ? size + 6 : size + 4}
              color={color}
            />
          ),
          tabBarLabelStyle: {
            fontFamily: typography.fonts.semibold,
            fontSize: typography.sizes.xs,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
