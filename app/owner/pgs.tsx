// app/owner/pgs.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { getToken, getUser } from "@/lib/authStorage";
import * as ImagePicker from "expo-image-picker";

type RoomInput = {
  type: string;
  pricePerMonth: string; // keep as string in form
  pricePerDay: string;
  totalBeds: string;
  availableBeds: string;
};

type PG = {
  _id: string;
  name: string;
  area: string;
  address: string;
  genderType: "boys" | "girls" | "co-ed";
  hasFood: boolean;
};

export default function OwnerPGsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [error, setError] = useState("");

  const [currentUserRole, setCurrentUserRole] = useState<
    "user" | "owner" | null
  >(null);

  // Form state for new PG
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [genderType, setGenderType] = useState<"boys" | "girls" | "co-ed">(
    "boys"
  );
  const [hasFood, setHasFood] = useState(false);
  const [amenities, setAmenities] = useState(""); // comma separated
  const [photos, setPhotos] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomInput[]>([
    {
      type: "Single",
      pricePerMonth: "",
      pricePerDay: "",
      totalBeds: "",
      availableBeds: "",
    },
  ]);
  const [creating, setCreating] = useState(false);

  const loadOwnerAndPGs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        setError("You must be logged in as an owner to manage PGs.");
        setCurrentUserRole(null);
        setPgs([]);
        return;
      }

      setCurrentUserRole(user.role);

      if (user.role !== "owner") {
        setError("Only PG owners can access this screen.");
        setPgs([]);
        return;
      }

      // Get all PGs, then filter by owner id on client side
      const res = await api.get("/api/pgs");
      const allPGs: any[] = res.data?.pgs ?? [];

      const myPGs = allPGs.filter((pg) => {
        // backend populates owner field
        return pg.owner && pg.owner._id === user.id;
      });

      setPgs(myPGs);
    } catch (err: any) {
      console.log(
        "Error loading owner PGs:",
        err.response?.data || err.message
      );
      const msg =
        err.response?.data?.message || "Failed to load PGs. Please try again.";
      setError(msg);
      setPgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerAndPGs();
  }, []);

  const updateRoomField = (
    index: number,
    field: keyof RoomInput,
    value: string
  ) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const addRoomRow = () => {
    setRooms((prev) => [
      ...prev,
      {
        type: "",
        pricePerMonth: "",
        pricePerDay: "",
        totalBeds: "",
        availableBeds: "",
      },
    ]);
  };

  const pickAndUploadImage = async () => {
    try {
      // 1. Permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your gallery to upload images."
        );
        return;
      }

      // 2. Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        Alert.alert("Not logged in", "Please login as owner first.");
        router.push("/login");
        return;
      }

      if (user.role !== "owner") {
        Alert.alert("Not owner", "Only owners can upload PG photos.");
        return;
      }

      // 3. Build FormData
      const formData = new FormData();
      formData.append(
        "image",
        {
          uri: asset.uri,
          name: "pg-photo.jpg",
          type: asset.mimeType || "image/jpeg",
        } as any
      );

      // 4. Upload to backend
      const res = await api.post("/api/uploads/pg-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = res.data.url;
      setPhotos((prev) => [...prev, imageUrl]);
    } catch (err: any) {
      console.log("Image upload error:", err.response?.data || err.message);
      Alert.alert("Upload error", "Failed to upload image. Please try again.");
    }
  };

  const createPG = async () => {
    if (!name || !area || !address) {
      Alert.alert("Missing fields", "Name, area and address are required.");
      return;
    }

    const token = await getToken();
    const user = await getUser();

    if (!token || !user) {
      Alert.alert("Not logged in", "Please login as owner first.");
      router.push("/login");
      return;
    }

    if (user.role !== "owner") {
      Alert.alert("Not owner", "Only owners can create PGs.");
      return;
    }

    // transform rooms
    const roomPayload = rooms
      .filter((r) => r.type && r.totalBeds)
      .map((r) => ({
        type: r.type,
        pricePerMonth: r.pricePerMonth ? Number(r.pricePerMonth) : undefined,
        pricePerDay: r.pricePerDay ? Number(r.pricePerDay) : undefined,
        totalBeds: Number(r.totalBeds),
        availableBeds: r.availableBeds
          ? Number(r.availableBeds)
          : Number(r.totalBeds),
      }));

    if (roomPayload.length === 0) {
      Alert.alert("Rooms required", "Please add at least one room type.");
      return;
    }

    const amenitiesArray =
      amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0) || [];

    try {
      setCreating(true);

      await api.post(
        "/api/pgs",
        {
          name,
          description: "",
          address,
          area,
          genderType,
          hasFood,
          amenities: amenitiesArray,
          photos, // ✅ send uploaded photo URLs
          rooms: roomPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "PG created successfully!");

      // reset form
      setName("");
      setArea("");
      setAddress("");
      setGenderType("boys");
      setHasFood(false);
      setAmenities("");
      setRooms([
        {
          type: "Single",
          pricePerMonth: "",
          pricePerDay: "",
          totalBeds: "",
          availableBeds: "",
        },
      ]);
      setPhotos([]); // reset photos

      // reload list
      await loadOwnerAndPGs();
    } catch (err: any) {
      console.log("Create PG error:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message || "Failed to create PG. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const renderPG = ({ item }: { item: PG }) => (
    <View style={styles.pgCard}>
      <Text style={styles.pgName}>{item.name}</Text>
      <Text style={styles.pgArea}>
        {item.area} • {item.genderType.toUpperCase()}
      </Text>
      <Text style={styles.pgAddress}>{item.address}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your PGs...</Text>
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
            onPress={loadOwnerAndPGs}
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

  if (currentUserRole !== "owner") {
    return (
      <View style={styles.center}>
        <Text>Only owners can manage PGs.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>My PGs</Text>
      {pgs.length === 0 ? (
        <Text style={{ marginBottom: 16 }}>
          You haven't added any PGs yet.
        </Text>
      ) : (
        <FlatList
          data={pgs}
          keyExtractor={(item) => item._id}
          renderItem={renderPG}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>Add New PG</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Sri Sai Boys Hostel"
      />

      <Text style={styles.label}>Area</Text>
      <TextInput
        style={styles.input}
        value={area}
        onChangeText={setArea}
        placeholder="Ameerpet"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Near metro station, Ameerpet"
      />

      <Text style={styles.label}>Gender Type</Text>
      <View style={styles.row}>
        {(["boys", "girls", "co-ed"] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, genderType === g && styles.chipSelected]}
            onPress={() => setGenderType(g)}
          >
            <Text
              style={[
                styles.chipText,
                genderType === g && styles.chipTextSelected,
              ]}
            >
              {g.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Food</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, hasFood && styles.chipSelected]}
          onPress={() => setHasFood(true)}
        >
          <Text
            style={[styles.chipText, hasFood && styles.chipTextSelected]}
          >
            Food available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, !hasFood && styles.chipSelected]}
          onPress={() => setHasFood(false)}
        >
          <Text
            style={[styles.chipText, !hasFood && styles.chipTextSelected]}
          >
            No food
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Amenities (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={amenities}
        onChangeText={setAmenities}
        placeholder="WiFi, Washing Machine, Geyser"
      />

      <Text style={styles.label}>Photos</Text>
      <View style={styles.photosRow}>
        {photos.map((url, index) => (
          <Image key={index} source={{ uri: url }} style={styles.photoThumb} />
        ))}
        <TouchableOpacity
          style={styles.photoAddButton}
          onPress={pickAndUploadImage}
        >
          <Text style={styles.photoAddText}>+ Add photo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Rooms</Text>
      {rooms.map((room, index) => (
        <View key={index} style={styles.roomRow}>
          <TextInput
            style={[styles.input, styles.roomInput]}
            placeholder="Type (Single)"
            value={room.type}
            onChangeText={(v) => updateRoomField(index, "type", v)}
          />
          <TextInput
            style={[styles.input, styles.roomInput]}
            placeholder="₹/month"
            keyboardType="numeric"
            value={room.pricePerMonth}
            onChangeText={(v) => updateRoomField(index, "pricePerMonth", v)}
          />
          <TextInput
            style={[styles.input, styles.roomInput]}
            placeholder="₹/day"
            keyboardType="numeric"
            value={room.pricePerDay}
            onChangeText={(v) => updateRoomField(index, "pricePerDay", v)}
          />
          <TextInput
            style={[styles.input, styles.roomInput]}
            placeholder="Total beds"
            keyboardType="numeric"
            value={room.totalBeds}
            onChangeText={(v) => updateRoomField(index, "totalBeds", v)}
          />
          <TextInput
            style={[styles.input, styles.roomInput]}
            placeholder="Available beds"
            keyboardType="numeric"
            value={room.availableBeds}
            onChangeText={(v) => updateRoomField(index, "availableBeds", v)}
          />
        </View>
      ))}

      <TouchableOpacity onPress={addRoomRow} style={styles.buttonOutline}>
        <Text style={styles.buttonOutlineText}>+ Add another room type</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.createButton, creating && { opacity: 0.7 }]}
        onPress={createPG}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create PG</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pgCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
    shadowColor: "#00000022",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pgName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pgArea: {
    fontSize: 13,
    color: "#666",
  },
  pgAddress: {
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  photosRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  photoAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  photoAddText: {
    fontSize: 13,
    fontWeight: "600",
  },
  roomRow: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 8,
  },
  roomInput: {
    marginTop: 4,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: "#1f6feb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonOutline: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "flex-start",
  },
  buttonOutlineText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
