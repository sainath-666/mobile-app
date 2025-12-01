// app/pg/[id].tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";

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
  photos?: string[]; // 👈 images from Cloudinary
  owner?: {
    name: string;
    phone: string;
    email: string;
  };
};

export default function PGDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pg, setPg] = useState<PG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // booking form state
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [stayType, setStayType] = useState<"daily" | "monthly">("daily");
  const [checkInDate, setCheckInDate] = useState(""); // simple text input for now: YYYY-MM-DD
  const [days, setDays] = useState("");
  const [months, setMonths] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchPGDetails = async () => {
    try {
      if (!id) {
        setError("Invalid PG id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const res = await api.get(`/api/pgs/${id}`);
      const pgData: PG | null = res.data?.pg ?? null;
      setPg(pgData);

      // default selected room: first one if exists
      if (pgData && pgData.rooms && pgData.rooms.length > 0) {
        setSelectedRoomType(pgData.rooms[0].type);
      }
    } catch (err: any) {
      console.log("Error fetching PG details:", err.message);
      setError("Failed to load PG details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPGDetails();
  }, [id]);

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[
        styles.roomCard,
        selectedRoomType === item.type && styles.roomCardSelected,
      ]}
      onPress={() => setSelectedRoomType(item.type)}
    >
      <Text style={styles.roomType}>{item.type}</Text>
      {item.pricePerMonth != null && (
        <Text>₹{item.pricePerMonth} / month</Text>
      )}
      {item.pricePerDay != null && <Text>₹{item.pricePerDay} / day</Text>}
      <Text>
        Beds: {item.availableBeds}/{item.totalBeds} available
      </Text>
      {selectedRoomType === item.type && (
        <Text style={styles.selectedLabel}>Selected</Text>
      )}
    </TouchableOpacity>
  );

  const handleBook = async () => {
    if (!pg || !id) return;

    if (!selectedRoomType) {
      Alert.alert("Select room", "Please select a room type first.");
      return;
    }

    if (!checkInDate) {
      Alert.alert("Check-in date", "Please enter check-in date (YYYY-MM-DD).");
      return;
    }

    if (stayType === "daily") {
      if (!days || Number(days) <= 0) {
        Alert.alert("Days required", "Please enter number of days.");
        return;
      }
    }

    if (stayType === "monthly") {
      if (!months || Number(months) <= 0) {
        Alert.alert("Months required", "Please enter number of months.");
        return;
      }
    }

    try {
      setBookingLoading(true);

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        Alert.alert(
          "Login required",
          "You must be logged in to book. Go to Login screen?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Login",
              onPress: () => router.push("/login"),
            },
          ]
        );
        return;
      }

      // build body for API
      const body: any = {
        pgId: id,
        roomType: selectedRoomType,
        stayType,
        checkInDate,
      };

      if (stayType === "daily") {
        body.days = Number(days);
      } else if (stayType === "monthly") {
        body.months = Number(months);
      }

      const res = await api.post("/api/bookings", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Booking response:", res.data);

      Alert.alert(
        "Booking created",
        `Your booking is created with status: ${res.data.booking.status}`,
        [
          {
            text: "OK",
            onPress: () => {
              // optionally reset form
              setDays("");
              setMonths("");
            },
          },
        ]
      );
    } catch (err: any) {
      console.log("Booking error:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message || "Booking failed. Please try again.";
      Alert.alert("Booking error", msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading PG details...</Text>
      </View>
    );
  }

  if (error || !pg) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", marginBottom: 8 }}>
          {error || "PG not found"}
        </Text>
        <Text style={{ color: "blue" }} onPress={() => router.back()}>
          Go back
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Basic details */}
      <Text style={styles.name}>{pg.name}</Text>
      <Text style={styles.area}>
        {pg.area}
        {pg.city ? `, ${pg.city}` : ""} • {pg.genderType.toUpperCase()}
      </Text>

      {/* Photos */}
      {pg.photos && pg.photos.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photosRow}>
            {pg.photos.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.photoLarge}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Details</Text>
      <Text>{pg.description || "No description provided."}</Text>

      <Text style={styles.sectionTitle}>Food</Text>
      <Text>{pg.hasFood ? "Food available" : "Food not included"}</Text>

      <Text style={styles.sectionTitle}>Amenities</Text>
      {pg.amenities && pg.amenities.length > 0 ? (
        <Text>{pg.amenities.join(", ")}</Text>
      ) : (
        <Text>No amenities listed.</Text>
      )}

      {/* Rooms list with selection */}
      <Text style={styles.sectionTitle}>Rooms (tap to select)</Text>
      {pg.rooms && pg.rooms.length > 0 ? (
        <FlatList
          data={pg.rooms}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderRoom}
        />
      ) : (
        <Text>No rooms configured.</Text>
      )}

      {pg.owner && (
        <>
          <Text style={styles.sectionTitle}>Owner Contact</Text>
          <Text>Name: {pg.owner.name}</Text>
          {pg.owner.phone && <Text>Phone: {pg.owner.phone}</Text>}
          {pg.owner.email && <Text>Email: {pg.owner.email}</Text>}
        </>
      )}

      {/* Booking section */}
      <Text style={styles.sectionTitle}>Book this PG</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, stayType === "daily" && styles.chipSelected]}
          onPress={() => {
            setStayType("daily");
            setMonths("");
          }}
        >
          <Text
            style={[
              styles.chipText,
              stayType === "daily" && styles.chipTextSelected,
            ]}
          >
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, stayType === "monthly" && styles.chipSelected]}
          onPress={() => {
            setStayType("monthly");
            setDays("");
          }}
        >
          <Text
            style={[
              styles.chipText,
              stayType === "monthly" && styles.chipTextSelected,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Check-in date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2025-12-01"
        value={checkInDate}
        onChangeText={setCheckInDate}
      />

      {stayType === "daily" ? (
        <>
          <Text style={styles.label}>Number of days</Text>
          <TextInput
            style={styles.input}
            placeholder="2"
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Number of months</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            keyboardType="numeric"
            value={months}
            onChangeText={setMonths}
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.bookButton, bookingLoading && { opacity: 0.7 }]}
        onPress={handleBook}
        disabled={bookingLoading}
      >
        {bookingLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Book Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  area: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  photosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  photoLarge: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  roomCard: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  roomCardSelected: {
    borderColor: "#1f6feb",
    backgroundColor: "#eef3ff",
  },
  roomType: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectedLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#1f6feb",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  chipSelected: {
    backgroundColor: "#1f6feb",
    borderColor: "#1f6feb",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
  },
  label: {
    marginTop: 10,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginTop: 4,
  },
  bookButton: {
    marginTop: 16,
    backgroundColor: "#1f6feb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
