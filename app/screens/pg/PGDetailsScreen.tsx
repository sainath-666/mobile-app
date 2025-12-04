// app/screens/pg/PGDetailsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";
import { colors, typography, spacing, borderRadius } from "@/theme";
import {
  Button,
  Input,
  Chip,
  Badge,
  LoadingSpinner,
  EmptyState,
  Card,
} from "@/components/common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [stayType, setStayType] = useState<"daily" | "monthly">("monthly");
  const [checkInDate, setCheckInDate] = useState("");
  const [days, setDays] = useState("");
  const [months, setMonths] = useState("1");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

      if (pgData && pgData.rooms && pgData.rooms.length > 0) {
        setSelectedRoomType(pgData.rooms[0].type);
      }

      // Set default check-in date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(tomorrow.toISOString().split("T")[0]);
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

  const handleBook = async () => {
    if (!pg || !id) return;

    if (!selectedRoomType) {
      Alert.alert("Select Room", "Please select a room type first.");
      return;
    }

    if (!checkInDate) {
      Alert.alert("Check-in Date", "Please enter check-in date.");
      return;
    }

    if (stayType === "daily" && (!days || Number(days) <= 0)) {
      Alert.alert("Days Required", "Please enter number of days.");
      return;
    }

    if (stayType === "monthly" && (!months || Number(months) <= 0)) {
      Alert.alert("Months Required", "Please enter number of months.");
      return;
    }

    try {
      setBookingLoading(true);

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        Alert.alert(
          "Login Required",
          "You must be logged in to book. Go to Login screen?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => router.push("/login") },
          ]
        );
        return;
      }

      const body: any = {
        pgId: id,
        roomType: selectedRoomType,
        stayType,
        checkInDate,
      };

      if (stayType === "daily") {
        body.days = Number(days);
      } else {
        body.months = Number(months);
      }

      const res = await api.post("/api/bookings", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert(
        "✅ Booking Confirmed!",
        `Your booking is created with status: ${res.data.booking.status}`,
        [
          {
            text: "View Bookings",
            onPress: () => router.push("/(tabs)/explore"),
          },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch (err: any) {
      console.log("Booking error:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message || "Booking failed. Please try again.";
      Alert.alert("Booking Error", msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading PG details..." />;
  }

  if (error || !pg) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="PG Not Found"
        message={error || "This PG no longer exists"}
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  const selectedRoom = pg.rooms?.find((r) => r.type === selectedRoomType);
  const calculatePrice = () => {
    if (!selectedRoom) return null;
    if (stayType === "daily" && selectedRoom.pricePerDay && days) {
      return selectedRoom.pricePerDay * Number(days);
    }
    if (stayType === "monthly" && selectedRoom.pricePerMonth && months) {
      return selectedRoom.pricePerMonth * Number(months);
    }
    return null;
  };

  const totalPrice = calculatePrice();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary.main}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {pg.photos && pg.photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {pg.photos.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons
                name="home-outline"
                size={64}
                color={colors.text.disabled}
              />
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.neutral.white}
            />
          </TouchableOpacity>

          {/* Image Dots */}
          {pg.photos && pg.photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {pg.photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Animatable.View animation="fadeInUp" duration={600}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{pg.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.location}>
                    {pg.area}
                    {pg.city && `, ${pg.city}`}
                  </Text>
                </View>
              </View>

              <Badge label={pg.genderType.toUpperCase()} variant="info" />
            </View>

            {/* Quick Info */}
            <Card style={styles.infoCard}>
              <View style={styles.infoGrid}>
                {pg.hasFood && (
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="restaurant"
                      size={24}
                      color={colors.success.main}
                    />
                    <Text style={styles.infoLabel}>Food Available</Text>
                  </View>
                )}
                {pg.rooms && pg.rooms.length > 0 && (
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="bed"
                      size={24}
                      color={colors.primary.main}
                    />
                    <Text style={styles.infoLabel}>
                      {pg.rooms.reduce((sum, r) => sum + r.availableBeds, 0)}{" "}
                      Beds Free
                    </Text>
                  </View>
                )}
                {pg.amenities && pg.amenities.length > 0 && (
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="star"
                      size={24}
                      color={colors.warning.main}
                    />
                    <Text style={styles.infoLabel}>
                      {pg.amenities.length} Amenities
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Description */}
            {pg.description && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{pg.description}</Text>
              </Card>
            )}

            {/* Amenities */}
            {pg.amenities && pg.amenities.length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {pg.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityChip}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.success.main}
                      />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Rooms */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Select Room Type</Text>
              {pg.rooms && pg.rooms.length > 0 ? (
                <View style={styles.roomsContainer}>
                  {pg.rooms.map((room, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.roomCard,
                        selectedRoomType === room.type &&
                          styles.roomCardSelected,
                      ]}
                      onPress={() => setSelectedRoomType(room.type)}
                    >
                      <View style={styles.roomHeader}>
                        <Text style={styles.roomType}>{room.type}</Text>
                        {selectedRoomType === room.type && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={colors.primary.main}
                          />
                        )}
                      </View>

                      <View style={styles.roomDetails}>
                        {room.pricePerMonth != null && (
                          <Text style={styles.roomPrice}>
                            ₹{room.pricePerMonth.toLocaleString()}/month
                          </Text>
                        )}
                        {room.pricePerDay != null && (
                          <Text style={styles.roomPriceSecondary}>
                            ₹{room.pricePerDay.toLocaleString()}/day
                          </Text>
                        )}
                      </View>

                      <View style={styles.roomFooter}>
                        <View style={styles.bedsInfo}>
                          <Ionicons
                            name="bed-outline"
                            size={16}
                            color={colors.text.secondary}
                          />
                          <Text style={styles.bedsText}>
                            {room.availableBeds}/{room.totalBeds} available
                          </Text>
                        </View>
                        {room.availableBeds === 0 && (
                          <Badge label="FULL" variant="error" size="small" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRooms}>No rooms available</Text>
              )}
            </Card>

            {/* Booking Form */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Book Your Stay</Text>

              <Text style={styles.inputLabel}>Stay Type</Text>
              <View style={styles.chipRow}>
                <Chip
                  label="Daily"
                  selected={stayType === "daily"}
                  onPress={() => {
                    setStayType("daily");
                    setMonths("");
                    setDays("1");
                  }}
                  variant="outlined"
                />
                <Chip
                  label="Monthly"
                  selected={stayType === "monthly"}
                  onPress={() => {
                    setStayType("monthly");
                    setDays("");
                    setMonths("1");
                  }}
                  variant="outlined"
                />
              </View>

              <Input
                label="Check-in Date"
                placeholder="YYYY-MM-DD"
                value={checkInDate}
                onChangeText={setCheckInDate}
                leftIcon="calendar-outline"
              />

              {stayType === "daily" ? (
                <Input
                  label="Number of Days"
                  placeholder="Enter days"
                  keyboardType="numeric"
                  value={days}
                  onChangeText={setDays}
                  leftIcon="time-outline"
                />
              ) : (
                <Input
                  label="Number of Months"
                  placeholder="Enter months"
                  keyboardType="numeric"
                  value={months}
                  onChangeText={setMonths}
                  leftIcon="calendar-outline"
                />
              )}

              {totalPrice !== null && (
                <View style={styles.priceBox}>
                  <Text style={styles.priceBoxLabel}>Total Amount</Text>
                  <Text style={styles.priceBoxValue}>
                    ₹{totalPrice.toLocaleString()}
                  </Text>
                </View>
              )}

              <Button
                title="Book Now"
                onPress={handleBook}
                loading={bookingLoading}
                disabled={bookingLoading}
                fullWidth
                size="large"
              />
            </Card>

            {/* Owner Contact */}
            {pg.owner && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Owner Contact</Text>
                <View style={styles.ownerInfo}>
                  <View style={styles.ownerRow}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.ownerText}>{pg.owner.name}</Text>
                  </View>
                  {pg.owner.phone && (
                    <View style={styles.ownerRow}>
                      <Ionicons
                        name="call"
                        size={20}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.ownerText}>{pg.owner.phone}</Text>
                    </View>
                  )}
                  {pg.owner.email && (
                    <View style={styles.ownerRow}>
                      <Ionicons
                        name="mail"
                        size={20}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.ownerText}>{pg.owner.email}</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </Animatable.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  imageContainer: {
    position: "relative",
    height: 300,
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  imagePlaceholder: {
    backgroundColor: colors.neutral.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? spacing["2xl"] : spacing.lg,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.overlay.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: {
    backgroundColor: colors.neutral.white,
    width: 24,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  location: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.gray50,
    borderRadius: borderRadius.lg,
  },
  amenityText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  roomsContainer: {
    gap: spacing.md,
  },
  roomCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  roomCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + "10",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  roomType: {
    ...typography.h6,
    color: colors.text.primary,
  },
  roomDetails: {
    marginBottom: spacing.sm,
  },
  roomPrice: {
    ...typography.h5,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  roomPriceSecondary: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bedsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bedsText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  noRooms: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  inputLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceBox: {
    backgroundColor: colors.primary.light + "15",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceBoxLabel: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  priceBoxValue: {
    ...typography.h4,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  ownerInfo: {
    gap: spacing.md,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ownerText: {
    ...typography.body1,
    color: colors.text.primary,
  },
});
