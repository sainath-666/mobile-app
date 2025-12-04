// app/screens/home/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { api } from "@/lib/api";
import { colors, typography, spacing, borderRadius, shadows } from "@/theme";
import { Input, Chip, LoadingSpinner, EmptyState } from "@/components/common";
import { PGCard } from "@/components/pg";

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
  photos?: string[];
};

export default function HomeScreen() {
  const router = useRouter();
  const [allPgs, setAllPgs] = useState<PG[]>([]);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchArea, setSearchArea] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    "all" | "boys" | "girls" | "co-ed"
  >("all");
  const [onlyWithFood, setOnlyWithFood] = useState(false);
  const [maxBudget, setMaxBudget] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPGs();
  }, []);

  useEffect(() => {
    let filtered = [...allPgs];

    if (searchArea.trim()) {
      const term = searchArea.trim().toLowerCase();
      filtered = filtered.filter(
        (pg) =>
          pg.area?.toLowerCase().includes(term) ||
          pg.city?.toLowerCase().includes(term) ||
          pg.name?.toLowerCase().includes(term)
      );
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter((pg) => pg.genderType === genderFilter);
    }

    if (onlyWithFood) {
      filtered = filtered.filter((pg) => pg.hasFood);
    }

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchPGs();
  };

  const clearFilters = () => {
    setSearchArea("");
    setGenderFilter("all");
    setOnlyWithFood(false);
    setMaxBudget("");
  };

  const hasActiveFilters =
    searchArea || genderFilter !== "all" || onlyWithFood || maxBudget;

  if (loading && !refreshing) {
    return <LoadingSpinner message="Finding best PGs for you..." />;
  }

  if (error && !refreshing) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Oops! Something went wrong"
        message={error}
        actionLabel="Try Again"
        onAction={fetchPGs}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary.main}
      />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary.main, colors.primary.dark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Find Your</Text>
            <Text style={styles.title}>Perfect PG Stay 🏠</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/login")}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.neutral.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animatable.View animation="fadeInUp" duration={600}>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search by area, city, or name..."
              value={searchArea}
              onChangeText={setSearchArea}
              leftIcon="search-outline"
              rightIcon={searchArea ? "close-circle" : undefined}
              onRightIconPress={() => setSearchArea("")}
              style={styles.searchInput}
            />
          </View>
        </Animatable.View>
      </LinearGradient>

      {/* Quick Stats */}
      <Animatable.View animation="fadeInUp" duration={800} delay={200}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="home" size={24} color={colors.primary.main} />
            <Text style={styles.statNumber}>{allPgs.length}</Text>
            <Text style={styles.statLabel}>PGs Available</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success.main}
            />
            <Text style={styles.statNumber}>{pgs.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color={colors.secondary.main} />
            <Text style={styles.statNumber}>HYD</Text>
            <Text style={styles.statLabel}>City</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Filter Toggle */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? "funnel" : "funnel-outline"}
            size={20}
            color={
              hasActiveFilters ? colors.primary.main : colors.text.secondary
            }
          />
          <Text
            style={[
              styles.filterToggleText,
              hasActiveFilters && styles.filterToggleTextActive,
            ]}
          >
            Filters
          </Text>
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>●</Text>
            </View>
          )}
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilters}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <Animatable.View
          animation="slideInDown"
          duration={400}
          style={styles.filtersContainer}
        >
          <Text style={styles.filterLabel}>Gender Type</Text>
          <View style={styles.filterRow}>
            {(["all", "boys", "girls", "co-ed"] as const).map((g) => (
              <Chip
                key={g}
                label={
                  g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)
                }
                selected={genderFilter === g}
                onPress={() => setGenderFilter(g)}
                size="medium"
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Amenities</Text>
          <View style={styles.filterRow}>
            <Chip
              label="🍛 Food Available"
              selected={onlyWithFood}
              onPress={() => setOnlyWithFood(!onlyWithFood)}
              size="medium"
            />
          </View>

          <Text style={styles.filterLabel}>Max Budget (₹/month)</Text>
          <Input
            placeholder="e.g., 10000"
            keyboardType="numeric"
            value={maxBudget}
            onChangeText={setMaxBudget}
            leftIcon="wallet-outline"
            rightIcon={maxBudget ? "close-circle" : undefined}
            onRightIconPress={() => setMaxBudget("")}
          />
        </Animatable.View>
      )}

      {/* PG List */}
      {pgs.length === 0 ? (
        <EmptyState
          icon="home-outline"
          title="No PGs Found"
          message={
            hasActiveFilters
              ? "Try adjusting your filters to see more results"
              : "No PGs available at the moment"
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <FlatList
          data={pgs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PGCard pg={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        />
      )}

      {/* Owner FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/owner/pgs")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.secondary.main, colors.secondary.dark]}
          style={styles.fabGradient}
        >
          <Ionicons
            name="business-outline"
            size={24}
            color={colors.neutral.white}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? spacing["3xl"] : spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.body1,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  title: {
    ...typography.h3,
    color: colors.neutral.white,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    marginTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.neutral.white,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: "center",
    ...shadows.sm,
  },
  statNumber: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filterToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  filterToggleText: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semiBold,
  },
  filterToggleTextActive: {
    color: colors.primary.main,
  },
  filterBadge: {
    marginLeft: spacing.xs,
  },
  filterBadgeText: {
    color: colors.primary.main,
    fontSize: 8,
  },
  clearFilters: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semiBold,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listContainer: {
    padding: spacing.lg,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.xl,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
