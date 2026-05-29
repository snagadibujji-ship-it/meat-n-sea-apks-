import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { usePlaceOrder } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: "dollar-sign" as const },
  { id: "upi", label: "UPI", icon: "smartphone" as const },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, vendorId, totalPaise, clearCart } = useCart();
  const { token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [note, setNote] = useState("");
  const placeMutation = usePlaceOrder();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePlaceOrder = async () => {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to place an order", [
        { text: "Cancel" },
        { text: "Sign In", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    if (!vendorId) return;
    try {
      await placeMutation.mutateAsync({
        data: {
          vendorId,
          userLocation: { lng: 77.5946, lat: 12.9716 },
          paymentMethod,
          customerNote: note || null,
        },
      });
      clearCart();
      Alert.alert("Order placed!", "Your order has been placed successfully", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch {
      Alert.alert("Error", "Could not place order. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={colors.light.foreground} />
      </TouchableOpacity>
      <Text style={styles.title}>Your Order</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{((item.pricePaise * item.quantity) / 100).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{(totalPaise / 100).toFixed(0)}</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.paymentRow, paymentMethod === pm.id && styles.paymentRowActive]}
              onPress={() => setPaymentMethod(pm.id)}
            >
              <View style={styles.paymentIcon}>
                <Feather name={pm.icon} size={16} color={paymentMethod === pm.id ? colors.light.primary : colors.light.mutedForeground} />
              </View>
              <Text style={[styles.paymentLabel, paymentMethod === pm.id && styles.paymentLabelActive]}>
                {pm.label}
              </Text>
              {paymentMethod === pm.id && (
                <Feather name="check-circle" size={16} color={colors.light.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Place order button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
        <TouchableOpacity
          style={[styles.placeBtn, placeMutation.isPending && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placeMutation.isPending}
        >
          {placeMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeBtnText}>Place Order</Text>
              <Text style={styles.placeBtnTotal}>₹{(totalPaise / 100).toFixed(0)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
  },
  itemQty: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    minWidth: 48,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginBottom: 8,
  },
  paymentRowActive: {
    borderColor: colors.light.primary,
    backgroundColor: `${colors.light.primary}08`,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
  },
  paymentLabelActive: {
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.background,
  },
  placeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.primary,
    borderRadius: colors.radius,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  placeBtnDisabled: {
    opacity: 0.6,
  },
  placeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  placeBtnTotal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.85)",
  },
});
