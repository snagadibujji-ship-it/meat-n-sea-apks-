import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGetMyOrders } from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "#FEF9C3", text: "#854D0E" },
  confirmed:  { bg: "#DBEAFE", text: "#1E40AF" },
  preparing:  { bg: "#FFEDD5", text: "#9A3412" },
  ready:      { bg: "#F3E8FF", text: "#6B21A8" },
  picked_up:  { bg: "#CFFAFE", text: "#155E75" },
  delivered:  { bg: "#DCFCE7", text: "#166534" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
};

function OrderCard({ order }: { order: Order }) {
  const status = order.currentStatus ?? "pending";
  const color = STATUS_COLORS[status] ?? { bg: colors.light.muted, text: colors.light.mutedForeground };
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.orderIdWrap}>
          <Feather name="package" size={14} color={colors.light.primary} />
          <Text style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
          <Text style={[styles.statusText, { color: color.text }]}>
            {status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.amount}>
          ₹{(order.totalAmountPaise / 100).toFixed(0)}
        </Text>
        <Text style={styles.payMethod}>
          {(order.paymentMethod ?? "—").toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <Feather name="clock" size={11} color={colors.light.mutedForeground} />
        <Text style={styles.date}>{date}</Text>
        {order.customerNote ? (
          <Text style={styles.note} numberOfLines={1}>· "{order.customerNote}"</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: orders, isLoading, error, refetch, isRefetching } = useGetMyOrders({
    query: { enabled: !!token },
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        {token && orders && orders.length > 0 && (
          <TouchableOpacity onPress={() => refetch()} disabled={isRefetching}>
            <Feather
              name="refresh-cw"
              size={18}
              color={isRefetching ? colors.light.mutedForeground : colors.light.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {!token ? (
        <View style={styles.center}>
          <Feather name="lock" size={40} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <Text style={styles.emptySub}>Track your deliveries after logging in</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.actionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.light.primary} />
          <Text style={styles.emptySub}>Loading your orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>Couldn't load orders</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => refetch()}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders && orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <OrderCard order={item} />}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      ) : (
        <View style={styles.center}>
          <Feather name="shopping-bag" size={40} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your order history will appear here</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/")}>
            <Text style={styles.actionBtnText}>Browse Vendors</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 14,
    gap: 8,
    marginBottom: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderIdWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderId: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  cardMid: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  amount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  payMethod: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  note: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    flex: 1,
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
  actionBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.light.primary,
    borderRadius: 24,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
