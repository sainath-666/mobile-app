// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { api } from "@/lib/api"; // uses lib/api.ts
import { useRouter } from "expo-router";

type Room = {
  type: string;
  pricePerMonth?: number;
  pricePerDay?: number;
  totalBeds: number;
  availableBeds: number;
};

type PG = {
  _id: string;
  name: string;
  area: string;
  city?: string;
  genderType: "boys" | "girls" | "co-ed";
  hasFood: boolean;
  amenities?: string[];
  rooms?: Room[];
  description?: string;
  photos?: string[]; // 👈 added for images
};

export default function HomeScreen() {
  const [allPgs, setAllPgs] = useState<PG[]>([]);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // filters
  const [searchArea, setSearchArea] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    "all" | "boys" | "girls" | "co-ed"
  >("all");
  const [onlyWithFood, setOnlyWithFood] = useState(false);
  const [maxBudget, setMaxBudget] = useState(""); // max monthly price

  const fetchPGs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/pgs");
      const list: PG[] = res.data?.pgs ?? [];
      setAllPgs(list);
      setPgs(list);
    } catch (err: any) {
      console.log("Error fetching PGs:", err.message);
      setError("Failed to load PGs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPGs();
  }, []);

  // recompute filtered list when filters or allPgs change
  useEffect(() => {
    let filtered = [...allPgs];

    // by area (substring match, case-insensitive)
    if (searchArea.trim()) {
      const term = searchArea.trim().toLowerCase();
      filtered = filtered.filter((pg) =>
        pg.area?.toLowerCase().includes(term)
      );
    }

    // by gender
    if (genderFilter !== "all") {
      filtered = filtered.filter((pg) => pg.genderType === genderFilter);
    }

    // by food
    if (onlyWithFood) {
      filtered = filtered.filter((pg) => pg.hasFood);
    }

    // by max budget (min room pricePerMonth)
    if (maxBudget.trim()) {
      const max = Number(maxBudget);
      if (!Number.isNaN(max) && max > 0) {
        filtered = filtered.filter((pg) => {
          if (!pg.rooms || pg.rooms.length === 0) return false;
          const minPrice = pg.rooms.reduce<number | null>((min, room) => {
            if (room.pricePerMonth == null) return min;
            if (min === null) return room.pricePerMonth;
            return room.pricePerMonth < min ? room.pricePerMonth : min;
          }, null);
          if (minPrice === null) return false;
          return minPrice <= max;
        });
      }
    }

    setPgs(filtered);
  }, [allPgs, searchArea, genderFilter, onlyWithFood, maxBudget]);

  const renderItem = ({ item }: { item: PG }) => {
    let minPrice: number | null = null;

    if (item.rooms && item.rooms.length > 0) {
      minPrice = item.rooms.reduce<number | null>((min, room) => {
        if (room.pricePerMonth == null) return min;
        if (min === null) return room.pricePerMonth;
        return room.pricePerMonth < min ? room.pricePerMonth : min;
      }, null);
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: "/pg/[id]",
            params: { id: item._id },
          });
        }}
      >
        {item.photos && item.photos.length > 0 && (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.cardImage}
          />
        )}
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.area}>
          {item.area} • {item.genderType.toUpperCase()}
        </Text>
        {minPrice !== null && (
          <Text style={styles.price}>From ₹{minPrice} / month</Text>
        )}
        <Text style={styles.food}>
          {item.hasFood ? "🍛 Food available" : "🚫 No food included"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading PGs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
        <TouchableOpacity onPress={fetchPGs} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar with navigation shortcuts */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>PGs in Hyderabad</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.topBarLink}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/owner/pgs")}>
            <Text style={styles.topBarLink}>Owner</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search area (e.g., Ameerpet, Madhapur)"
          value={searchArea}
          onChangeText={setSearchArea}
        />

        <View style={styles.filterRow}>
          {(["all", "boys", "girls", "co-ed"] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.chip,
                genderFilter === g && styles.chipSelected,
              ]}
              onPress={() => setGenderFilter(g)}
            >
              <Text
                style={[
                  styles.chipText,
                  genderFilter === g && styles.chipTextSelected,
                ]}
              >
                {g === "all" ? "ALL" : g.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, onlyWithFood && styles.chipSelected]}
            onPress={() => setOnlyWithFood((prev) => !prev)}
          >
            <Text
              style={[
                styles.chipText,
                onlyWithFood && styles.chipTextSelected,
              ]}
            >
              Food only
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.budgetInput]}
            placeholder="Max ₹/month"
            keyboardType="numeric"
            value={maxBudget}
            onChangeText={setMaxBudget}
          />
        </View>
      </View>

      {pgs.length === 0 ? (
        <View style={styles.center}>
          <Text>No PGs match your filters.</Text>
        </View>
      ) : (
        <FlatList
          data={pgs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  topBarLink: {
    fontSize: 14,
    color: "#1f6feb",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  chipSelected: {
    backgroundColor: "#1f6feb",
    borderColor: "#1f6feb",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
  },
  budgetInput: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#00000033",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  area: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  food: {
    fontSize: 13,
    color: "#333",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  retryText: {
    fontWeight: "600",
  },
});
