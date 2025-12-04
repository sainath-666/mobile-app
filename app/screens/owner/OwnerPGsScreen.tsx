// app/screens/owner/OwnerPGsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";
import { colors, typography, spacing, borderRadius } from "@/theme";
import {
  Button,
  Input,
  Chip,
  LoadingSpinner,
  EmptyState,
  Card,
} from "@/components/common";

type PG = {
  _id: string;
  name: string;
  area: string;
  address: string;
  genderType: "boys" | "girls" | "co-ed";
  hasFood: boolean;
  photos?: string[];
};

export default function OwnerPGsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [genderType, setGenderType] = useState<"boys" | "girls" | "co-ed">(
    "boys"
  );
  const [hasFood, setHasFood] = useState(false);
  const [amenities, setAmenities] = useState("");
  const [description, setDescription] = useState("");

  const loadOwnerAndPGs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        setError("You must be logged in as an owner to manage PGs.");
        setPgs([]);
        return;
      }

      if (user.role !== "owner") {
        setError("Only PG owners can access this screen.");
        setPgs([]);
        return;
      }

      const res = await api.get("/api/pgs");
      const allPGs: any[] = res.data?.pgs ?? [];

      const myPGs = allPGs.filter((pg) => pg.owner && pg.owner._id === user.id);
      setPgs(myPGs);
    } catch (err: any) {
      console.log("Error loading PGs:", err.message);
      setError("Failed to load your PGs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerAndPGs();
  }, []);

  const handleCreatePG = async () => {
    if (!name || !area || !address) {
      Alert.alert("Missing Fields", "Please fill in name, area, and address.");
      return;
    }

    try {
      setCreating(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      const body = {
        name,
        area,
        address,
        genderType,
        hasFood,
        amenities: amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        description: description || undefined,
        rooms: [
          {
            type: "Single",
            pricePerMonth: 8000,
            pricePerDay: 500,
            totalBeds: 10,
            availableBeds: 10,
          },
        ],
      };

      await api.post("/api/pgs", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "PG created successfully!");

      // Reset form
      setName("");
      setArea("");
      setAddress("");
      setGenderType("boys");
      setHasFood(false);
      setAmenities("");
      setDescription("");
      setShowForm(false);

      loadOwnerAndPGs();
    } catch (err: any) {
      console.log("Error creating PG:", err.response?.data || err.message);
      const msg = err.response?.data?.message || "Failed to create PG.";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const renderPGCard = (pg: PG) => (
    <Animatable.View animation="fadeInUp" duration={600} key={pg._id}>
      <Card style={styles.pgCard}>
        <View style={styles.pgHeader}>
          <View style={styles.pgHeaderLeft}>
            <Text style={styles.pgName}>{pg.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.pgArea}>{pg.area}</Text>
            </View>
          </View>
          <Chip
            label={pg.genderType.toUpperCase()}
            variant="outlined"
            size="small"
          />
        </View>

        <View style={styles.pgDetails}>
          <View style={styles.pgDetailItem}>
            <Ionicons
              name={pg.hasFood ? "checkmark-circle" : "close-circle"}
              size={18}
              color={pg.hasFood ? colors.success.main : colors.error.main}
            />
            <Text style={styles.pgDetailText}>
              {pg.hasFood ? "Food Available" : "No Food"}
            </Text>
          </View>
        </View>

        <View style={styles.pgActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push({ pathname: "/pg/[id]", params: { id: pg._id } })
            }
          >
            <Ionicons
              name="eye-outline"
              size={18}
              color={colors.primary.main}
            />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animatable.View>
  );

  if (loading) {
    return <LoadingSpinner message="Loading your PGs..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="business-outline"
        title="Access Denied"
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
        backgroundColor={colors.secondary.main}
      />

      {/* Header */}
      <LinearGradient
        colors={[colors.secondary.main, colors.secondary.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.neutral.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My PG Properties</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="business" size={32} color={colors.secondary.main} />
            <Text style={styles.statNumber}>{pgs.length}</Text>
            <Text style={styles.statLabel}>Total PGs</Text>
          </Card>
        </View>

        {/* PG List */}
        {pgs.length === 0 && !showForm ? (
          <EmptyState
            icon="home-outline"
            title="No PGs Yet"
            message="Create your first PG property to start receiving bookings"
            actionLabel="Create PG"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>{pgs.map((pg) => renderPGCard(pg))}</>
        )}

        {/* Create Form */}
        {showForm && (
          <Animatable.View animation="fadeIn" duration={400}>
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Create New PG</Text>

              <Input
                label="PG Name *"
                placeholder="e.g., Sunshine PG"
                value={name}
                onChangeText={setName}
                leftIcon="home-outline"
              />

              <Input
                label="Area *"
                placeholder="e.g., Ameerpet"
                value={area}
                onChangeText={setArea}
                leftIcon="location-outline"
              />

              <Input
                label="Full Address *"
                placeholder="Complete address"
                value={address}
                onChangeText={setAddress}
                leftIcon="map-outline"
              />

              <Text style={styles.inputLabel}>Gender Type</Text>
              <View style={styles.chipRow}>
                {(["boys", "girls", "co-ed"] as const).map((type) => (
                  <Chip
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    selected={genderType === type}
                    onPress={() => setGenderType(type)}
                    variant="outlined"
                  />
                ))}
              </View>

              <View style={styles.chipRow}>
                <Chip
                  label="🍛 Food Available"
                  selected={hasFood}
                  onPress={() => setHasFood(!hasFood)}
                  variant="outlined"
                />
              </View>

              <Input
                label="Amenities (comma-separated)"
                placeholder="WiFi, AC, Laundry"
                value={amenities}
                onChangeText={setAmenities}
                leftIcon="star-outline"
              />

              <Input
                label="Description"
                placeholder="Brief description..."
                value={description}
                onChangeText={setDescription}
                leftIcon="document-text-outline"
              />

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowForm(false)}
                  variant="outline"
                  style={styles.formButton}
                />
                <Button
                  title="Create PG"
                  onPress={handleCreatePG}
                  loading={creating}
                  disabled={creating}
                  style={styles.formButton}
                />
              </View>
            </Card>
          </Animatable.View>
        )}

        {/* Add Button */}
        {!showForm && pgs.length > 0 && (
          <Button
            title="Add New PG"
            onPress={() => setShowForm(true)}
            variant="secondary"
            icon={
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.neutral.white}
              />
            }
            style={styles.addButton}
          />
        )}
      </ScrollView>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.h4,
    color: colors.neutral.white,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statCard: {
    alignItems: "center",
    padding: spacing.lg,
  },
  statNumber: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pgCard: {
    marginBottom: spacing.md,
  },
  pgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  pgHeaderLeft: {
    flex: 1,
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
  },
  pgDetails: {
    marginBottom: spacing.md,
  },
  pgDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pgDetailText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  pgActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semiBold,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  formButton: {
    flex: 1,
  },
  addButton: {
    marginTop: spacing.md,
  },
});
