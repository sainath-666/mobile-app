// app/(tabs)/explore.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";
import { useRouter } from "expo-router";

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

export default function BookingsTab() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [viewType, setViewType] = useState<"user" | "owner">("user"); // what to show

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

      // decide endpoint
      const endpoint =
        viewType === "owner"
          ? "/api/bookings/owner"
          : "/api/bookings/my";

      const res = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data?.bookings ?? []);
    } catch (err: any) {
      console.log("Error loading bookings:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message || "Failed to load bookings. Please try again.";
      setError(msg);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndBookings();
  }, [viewType]);

  const renderBooking = ({ item }: { item: Booking }) => {
    const pgName = item.pg?.name || "PG not found";
    const pgArea = item.pg?.area || "";
    const date = item.checkInDate
      ? new Date(item.checkInDate).toISOString().slice(0, 10)
      : "";

    let duration = "";
    if (item.stayType === "daily" && item.days) {
      duration = `${item.days} day(s)`;
    } else if (item.stayType === "monthly" && item.months) {
      duration = `${item.months} month(s)`;
    }

    return (
      <View style={styles.card}>
        <Text style={styles.pgName}>{pgName}</Text>
        <Text style={styles.pgArea}>{pgArea}</Text>

        <Text style={styles.rowText}>
          Room: <Text style={styles.bold}>{item.roomType}</Text>
        </Text>
        <Text style={styles.rowText}>
          Stay: <Text style={styles.bold}>{item.stayType.toUpperCase()}</Text>{" "}
          {duration ? `• ${duration}` : ""}
        </Text>
        <Text style={styles.rowText}>
          Check-in: <Text style={styles.bold}>{date}</Text>
        </Text>
        <Text style={styles.rowText}>
          Amount: <Text style={styles.bold}>₹{item.totalAmount}</Text>
        </Text>
        <Text style={styles.rowText}>
          Status: <Text style={styles.status}>{item.status}</Text>
        </Text>

        {viewType === "owner" && item.user && (
          <Text style={styles.rowText}>
            User:{" "}
            <Text style={styles.bold}>
              {item.user.name}
              {item.user.phone ? ` (${item.user.phone})` : ""}
            </Text>
          </Text>
        )}
      </View>
    );
  };

  const showOwnerToggle =
    currentUser && currentUser.role === "owner";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={loadUserAndBookings}
          >
            <Text style={styles.buttonOutlineText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonOutlineText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar with switch (if owner) */}
      <View style={styles.topBar}>
        <Text style={styles.title}>
          {viewType === "user" ? "My Bookings" : "Bookings for My PGs"}
        </Text>
        {showOwnerToggle && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                viewType === "user" && styles.toggleChipActive,
              ]}
              onPress={() => setViewType("user")}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewType === "user" && styles.toggleTextActive,
                ]}
              >
                As User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                viewType === "owner" && styles.toggleChipActive,
              ]}
              onPress={() => setViewType("owner")}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewType === "owner" && styles.toggleTextActive,
                ]}
              >
                As Owner
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {bookings.length === 0 ? (
        <View style={styles.center}>
          <Text>No bookings found for this view.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  toggleChipActive: {
    backgroundColor: "#1f6feb",
    borderColor: "#1f6feb",
  },
  toggleText: {
    fontSize: 13,
    color: "#333",
  },
  toggleTextActive: {
    color: "#fff",
  },
  card: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#00000022",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pgName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pgArea: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  rowText: {
    fontSize: 13,
    marginTop: 2,
  },
  bold: {
    fontWeight: "600",
  },
  status: {
    textTransform: "capitalize",
  },
  buttonOutline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonOutlineText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
