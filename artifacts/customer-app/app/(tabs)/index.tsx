import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetNearbyVendors } from "@workspace/api-client-react";
import type { Vendor } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

const DEFAULT_LNG = "77.5946";
const DEFAULT_LAT = "12.9716";

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardIconWrap}>
        <Feather name="shopping-bag" size={22} color={colors.light.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: vendor.isOpen ? colors.light.success : colors.light.mutedForeground }]} />
        </View>
        <Text style={styles.vendorSub}>
          {vendor.isOpen ? "Open" : "Closed"} · {vendor.serviceRadiusKm} km radius
        </Text>
        {vendor.distance != null && (
          <Text style={styles.vendorDistance}>{vendor.distance.toFixed(1)} km away</Text>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const { data: vendors, isLoading, isRefetching, refetch, error } = useGetNearbyVendors({
    lng: DEFAULT_LNG,
    lat: DEFAULT_LAT,
    maxDistance: "10000",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Fresh Catch</Text>
          <Text style={styles.headerTitle}>Meat N Sea</Text>
        </View>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => router.push("/auth")}
        >
          <Feather name={token ? "user-check" : "log-in"} size={18} color={token ? colors.light.primary : colors.light.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>Vendors Near You</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.light.primary} />
          <Text style={styles.loadingText}>Finding vendors...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={colors.light.mutedForeground} />
          <Text style={styles.errorTitle}>Couldn't load vendors</Text>
          <Text style={styles.errorSub}>Check that the API server is running</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => v._id}
          renderItem={({ item }) => (
            <VendorCard vendor={item} onPress={() => router.push(`/vendor/${item._id}`)} />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(vendors && vendors.length > 0)}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="map-pin" size={36} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>No vendors nearby</Text>
              <Text style={styles.emptySub}>Try expanding your search area</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.light.primary}
            />
          }
        />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGreeting: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginTop: 1,
  },
  authBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 14,
    gap: 12,
    marginBottom: 2,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.light.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vendorName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vendorSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  vendorDistance: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.light.accent,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    marginTop: 8,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.light.primary,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
});
