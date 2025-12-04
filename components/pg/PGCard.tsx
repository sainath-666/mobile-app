// components/pg/PGCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, typography, spacing, borderRadius, shadows } from "@/theme";
import { Badge } from "@/components/common";

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

interface PGCardProps {
  pg: PG;
}

export const PGCard: React.FC<PGCardProps> = ({ pg }) => {
  const router = useRouter();

  const minPrice =
    pg.rooms?.reduce<number | null>((min, room) => {
      if (room.pricePerMonth == null) return min;
      if (min === null) return room.pricePerMonth;
      return room.pricePerMonth < min ? room.pricePerMonth : min;
    }, null) ?? null;

  const totalBeds =
    pg.rooms?.reduce((sum, room) => sum + room.totalBeds, 0) ?? 0;
  const availableBeds =
    pg.rooms?.reduce((sum, room) => sum + room.availableBeds, 0) ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/pg/[id]", params: { id: pg._id } })
      }
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {pg.photos && pg.photos.length > 0 ? (
          <Image source={{ uri: pg.photos[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons
              name="home-outline"
              size={48}
              color={colors.text.disabled}
            />
          </View>
        )}

        {/* Badge overlay */}
        <View style={styles.badgeContainer}>
          <Badge
            label={pg.genderType.toUpperCase()}
            variant="info"
            size="small"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {pg.name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.location} numberOfLines={1}>
            {pg.area}
            {pg.city && `, ${pg.city}`}
          </Text>
        </View>

        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          {pg.hasFood && (
            <View style={styles.amenityItem}>
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={colors.success.main}
              />
              <Text style={styles.amenityText}>Food</Text>
            </View>
          )}
          {availableBeds > 0 && (
            <View style={styles.amenityItem}>
              <Ionicons
                name="bed-outline"
                size={16}
                color={colors.primary.main}
              />
              <Text style={styles.amenityText}>
                {availableBeds}/{totalBeds} available
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.footer}>
          {minPrice !== null && (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{minPrice.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
          )}

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.primary.main}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: colors.neutral.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  location: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  amenityText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    ...typography.h5,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semiBold,
  },
});
