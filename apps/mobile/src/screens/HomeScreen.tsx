import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StationAutocomplete } from "../components/StationAutocomplete";
import type { Station } from "../api/types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [barrierFreeMode, setBarrierFreeMode] = useState(true);

  const canSearch = fromStation !== null && toStation !== null && fromStation.id !== toStation.id;

  function handleFindRoutes() {
    if (!fromStation || !toStation) return;
    navigation.navigate("Results", {
      fromStationId: fromStation.id,
      fromName: fromStation.name,
      toStationId: toStation.id,
      toName: toStation.name,
      barrierFreeMode,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BarrierFree</Text>
      <Text style={styles.subtitle}>Journeys with no ticket barriers, ever.</Text>

      <StationAutocomplete
        label="From"
        placeholder="Enter starting station"
        selectedName={fromStation?.name ?? null}
        onSelect={setFromStation}
      />

      <StationAutocomplete
        label="To"
        placeholder="Enter destination station"
        selectedName={toStation?.name ?? null}
        onSelect={setToStation}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>Barrier-Free Mode</Text>
          <Text style={styles.toggleHint}>Only show routes with no barriers at any point</Text>
        </View>
        <Switch value={barrierFreeMode} onValueChange={setBarrierFreeMode} />
      </View>

      <Pressable
        style={[styles.button, !canSearch && styles.buttonDisabled]}
        disabled={!canSearch}
        onPress={handleFindRoutes}
      >
        <Text style={styles.buttonText}>Find routes</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 28 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 28,
  },
  toggleLabelGroup: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: "600", color: "#111" },
  toggleHint: { fontSize: 12, color: "#777", marginTop: 2 },
  button: {
    backgroundColor: "#1a7f3c",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#b6d9c2" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
