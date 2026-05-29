import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGlobalSearch } from "@workspace/api-client-react";
import colors from "@/constants/colors";

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading } = useGlobalSearch(
    { q: debounced, limit: "20" },
    { query: { enabled: debounced.length >= 2 } }
  );

  const hasResults = data && (data.vendors.length > 0 || data.products.length > 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.light.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors, products..."
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={16} color={colors.light.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {debounced.length < 2 ? (
        <View style={styles.placeholder}>
          <Feather name="search" size={40} color={colors.light.mutedForeground} />
          <Text style={styles.placeholderText}>Type to search vendors or products</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.light.primary} />
        </View>
      ) : !hasResults ? (
        <View style={styles.placeholder}>
          <Feather name="inbox" size={40} color={colors.light.mutedForeground} />
          <Text style={styles.placeholderText}>No results for "{debounced}"</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(data?.vendors ?? []).map((v) => ({ type: "vendor" as const, item: v })),
            ...(data?.products ?? []).map((p) => ({ type: "product" as const, item: p })),
          ]}
          keyExtractor={(row) => `${row.type}-${row.item._id}`}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: row }) => {
            if (row.type === "vendor") {
              const v = row.item as ReturnType<typeof data.vendors>[0];
              return (
                <TouchableOpacity
                  style={styles.resultRow}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/vendor/${v._id}`)}
                >
                  <View style={styles.resultIcon}>
                    <Feather name="shopping-bag" size={18} color={colors.light.primary} />
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultTitle}>{v.name}</Text>
                    <Text style={styles.resultSub}>Vendor · {v.isOpen ? "Open" : "Closed"}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.light.mutedForeground} />
                </TouchableOpacity>
              );
            }
            const p = row.item as ReturnType<typeof data.products>[0];
            return (
              <View style={styles.resultRow}>
                <View style={[styles.resultIcon, { backgroundColor: `${colors.light.accent}18` }]}>
                  <Feather name="box" size={18} color={colors.light.accent} />
                </View>
                <View style={styles.resultBody}>
                  <Text style={styles.resultTitle}>{p.name}</Text>
                  <Text style={styles.resultSub}>₹{(p.pricePaise / 100).toFixed(0)} · {p.isOutOfStock ? "Out of stock" : "In stock"}</Text>
                </View>
              </View>
            );
          }}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${colors.light.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBody: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  resultSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    marginTop: 1,
  },
});
