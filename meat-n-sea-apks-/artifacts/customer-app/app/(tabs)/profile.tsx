import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, userId, role, clearAuth } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {token ? (
        <View style={styles.content}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Feather name="user" size={30} color={colors.light.primary} />
            </View>
            <Text style={styles.userId}>User #{userId?.slice(-6)}</Text>
            {role && <Text style={styles.role}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="map-pin" size={18} color={colors.light.foreground} />
              <Text style={styles.menuLabel}>Saved Addresses</Text>
              <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="help-circle" size={18} color={colors.light.foreground} />
              <Text style={styles.menuLabel}>Help & Support</Text>
              <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
            <Feather name="log-out" size={16} color={colors.light.destructive} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <Feather name="user" size={40} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>Not signed in</Text>
          <Text style={styles.emptySub}>Sign in to access your profile and orders</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarWrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.light.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  userId: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  role: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textTransform: "capitalize",
  },
  section: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.light.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: `${colors.light.destructive}40`,
    backgroundColor: `${colors.light.destructive}08`,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.destructive,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
    marginBottom: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  signInBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.light.primary,
    borderRadius: 24,
  },
  signInText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
