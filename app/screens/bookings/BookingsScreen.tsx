// app/screens/bookings/BookingsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";
import { colors, typography, spacing, borderRadius, shadows } from "@/theme";
import {
  Badge,
  LoadingSpinner,
  EmptyState,
  Card,
  Chip,
} from "@/components/common";

type PG = {
  _id: string;
  name: string;
  area: string;
  city?: string;
};

type UserInfo = {
  id: string;
  name: string;
  phone: string;
  role: "user" | "owner";
};

type Booking = {
  _id: string;
  pg: PG | null;
  roomType: string;
  stayType: "daily" | "monthly";
  checkInDate: string;
  days?: number | null;
  months?: number | null;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  user?: {
    name: string;
    phone?: string;
  };
};

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [viewType, setViewType] = useState<"user" | "owner">("user");

  const loadUserAndBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        setError("You are not logged in. Please login to see bookings.");
        setBookings([]);
        return;
      }

      setCurrentUser(user);

      const endpoint =
        viewType === "owner" ? "/api/bookings/owner" : "/api/bookings/my";

      const res = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data?.bookings ?? []);
    } catch (err: any) {
      console.log("Error loading bookings:", err.response?.data || err.message);
      const msg = err.response?.data?.message || "Failed to load bookings.";
      setError(msg);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserAndBookings();
  }, [viewType]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndBookings();
  };

  const getStatusVariant = (
    status: string
  ): "success" | "warning" | "error" => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "warning";
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const pgName = item.pg?.name || "PG not found";
    const pgArea = item.pg?.area || "";
    const date = item.checkInDate
      ? new Date(item.checkInDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

    let duration = "";
    if (item.stayType === "daily" && item.days) {
      duration = `${item.days} day(s)`;
    } else if (item.stayType === "monthly" && item.months) {
      duration = `${item.months} month(s)`;
    }

    return (
      <Animatable.View animation="fadeInUp" duration={600}>
        <Card style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingLeft}>
              <Text style={styles.pgName} numberOfLines={1}>
                {pgName}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.pgArea} numberOfLines={1}>
                  {pgArea}
                </Text>
              </View>
            </View>
            <Badge
              label={item.status.toUpperCase()}
              variant={getStatusVariant(item.status)}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons
                name="bed-outline"
                size={18}
                color={colors.text.secondary}
              />
              <Text style={styles.detailLabel}>Room:</Text>
              <Text style={styles.detailValue}>{item.roomType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.text.secondary}
              />
              <Text style={styles.detailLabel}>Stay:</Text>
              <Text style={styles.detailValue}>
                {item.stayType.toUpperCase()} • {duration}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.text.secondary}
              />
              <Text style={styles.detailLabel}>Check-in:</Text>
              <Text style={styles.detailValue}>{date}</Text>
            </View>

            {viewType === "owner" && item.user && (
              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.text.secondary}
                />
                <Text style={styles.detailLabel}>User:</Text>
                <Text style={styles.detailValue}>
                  {item.user.name}
                  {item.user.phone ? ` (${item.user.phone})` : ""}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.bookingFooter}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>
                ₹{item.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      </Animatable.View>
    );
  };

  const showOwnerToggle = currentUser && currentUser.role === "owner";

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading your bookings..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Unable to Load Bookings"
        message={error}
        actionLabel="Go to Login"
        onAction={() => router.push("/login")}
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
        <Text style={styles.headerTitle}>
          {viewType === "user" ? "My Bookings" : "PG Bookings"}
        </Text>

        {showOwnerToggle && (
          <View style={styles.toggleContainer}>
            <Chip
              label="As User"
              selected={viewType === "user"}
              onPress={() => setViewType("user")}
              variant="filled"
              size="small"
            />
            <Chip
              label="As Owner"
              selected={viewType === "owner"}
              onPress={() => setViewType("owner")}
              variant="filled"
              size="small"
            />
          </View>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {bookings.filter((b) => b.status === "confirmed").length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {bookings.filter((b) => b.status === "pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Bookings Found"
          message={
            viewType === "user"
              ? "Start exploring PGs and book your perfect stay!"
              : "No bookings for your PGs yet"
          }
          actionLabel={viewType === "user" ? "Explore PGs" : undefined}
          onAction={
            viewType === "user" ? () => router.push("/(tabs)") : undefined
          }
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingTop:
      Platform.OS === "ios" ? spacing["2xl"] + spacing.lg : spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.neutral.white,
    marginBottom: spacing.md,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: "center",
    ...shadows.sm,
  },
  statNumber: {
    ...typography.h4,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  listContainer: {
    padding: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  bookingLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  pgName: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pgArea: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  bookingDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    width: 80,
  },
  detailValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  amountValue: {
    ...typography.h5,
    color: colors.success.main,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
});
