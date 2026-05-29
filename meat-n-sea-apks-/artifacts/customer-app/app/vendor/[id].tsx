import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetProducts } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import colors from "@/constants/colors";

function ProductItem({
  product,
  vendorId,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  vendorId: string;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.productCard, product.isOutOfStock && styles.productCardOos]}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImg} />
      ) : (
        <View style={[styles.productImg, styles.productImgPlaceholder]}>
          <Feather name="box" size={20} color={colors.light.mutedForeground} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.description && (
          <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
        )}
        <Text style={styles.productPrice}>₹{(product.pricePaise / 100).toFixed(0)}</Text>
      </View>
      <View style={styles.qtyControl}>
        {product.isOutOfStock ? (
          <Text style={styles.oosText}>Out of stock</Text>
        ) : qty > 0 ? (
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
              <Feather name="minus" size={14} color={colors.light.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}>
              <Feather name="plus" size={14} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Feather name="plus" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, removeItem, items, totalItems, totalPaise } = useCart();

  const { data: products, isLoading } = useGetProducts({ vendorId: id });

  const getQty = (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 16);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={colors.light.foreground} />
      </TouchableOpacity>

      <Text style={styles.vendorIdLabel}>Vendor #{id?.slice(-6)}</Text>
      <Text style={styles.vendorTitle}>Menu</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + (totalItems > 0 ? 80 : 0) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="box" size={36} color={colors.light.mutedForeground} />
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              vendorId={id!}
              qty={getQty(item._id)}
              onAdd={() =>
                addItem({
                  productId: item._id,
                  name: item.name,
                  pricePaise: item.pricePaise,
                  imageUrl: item.imageUrl,
                  vendorId: id!,
                })
              }
              onRemove={() => removeItem(item._id)}
            />
          )}
        />
      )}

      {/* Cart bar */}
      {totalItems > 0 && (
        <View style={[styles.cartBar, { paddingBottom: bottomPad }]}>
          <View>
            <Text style={styles.cartItems}>{totalItems} item{totalItems !== 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{(totalPaise / 100).toFixed(0)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push("/checkout")}>
            <Text style={styles.checkoutText}>View Cart</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
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
  vendorIdLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
  },
  vendorTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    gap: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 12,
    gap: 10,
    marginBottom: 2,
  },
  productCardOos: {
    opacity: 0.6,
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  productImgPlaceholder: {
    backgroundColor: colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  productDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
    marginTop: 2,
  },
  qtyControl: {
    alignItems: "center",
    justifyContent: "center",
  },
  oosText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: colors.light.destructive,
    textAlign: "center",
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.light.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    minWidth: 16,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.foreground,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
  },
  cartItems: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  cartTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  checkoutText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
