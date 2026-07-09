import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getJourneys, ApiError } from "../api/client";
import type { JourneyRoute } from "../api/types";
import { BarrierBadge } from "../components/BarrierBadge";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Results">;

export function ResultsScreen({ route, navigation }: Props) {
  const { fromStationId, fromName, toStationId, toName, barrierFreeMode } = route.params;
  const [routes, setRoutes] = useState<JourneyRoute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJourneys(fromStationId, toStationId, barrierFreeMode);
        if (!cancelled) setRoutes(result.routes);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fromStationId, toStationId, barrierFreeMode]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.routeSummary}>
        {fromName} → {toName}
      </Text>

      {loading && <ActivityIndicator style={styles.spinner} size="large" />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && routes?.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No barrier-free routes found</Text>
          <Text style={styles.emptyHint}>
            {barrierFreeMode
              ? "Every option TfL suggests passes through at least one gated or unverified station."
              : "TfL didn't return any journeys for this pair of stations."}
          </Text>
        </View>
      )}

      {routes?.map((r, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardTitle}>
            {index === 0 ? "Best Barrier-Free Route" : `Route ${index + 1}`}
          </Text>
          <Text style={styles.duration}>{r.durationMinutes} minutes</Text>
          <Text style={styles.changes}>
            {r.changes === 0 ? "Direct — no changes" : `${r.changes} change${r.changes > 1 ? "s" : ""}`}
          </Text>

          <View style={styles.stationsList}>
            {r.stations.map((s, i) => (
              <Pressable
                key={i}
                style={styles.stationRow}
                disabled={!s.stationId}
                onPress={() => s.stationId && navigation.navigate("StationDetails", { stationId: s.stationId })}
              >
                <Text style={styles.stationName}>
                  {s.confirmed ? "✅" : s.status === "GATED" ? "🚧" : "❔"} {s.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.footerRow}>
            <BarrierBadge status={r.isBarrierFree ? "OPEN_ACCESS" : "UNKNOWN"} />
            <Text style={styles.confirmationLabel}>
              {r.isBarrierFree ? "Barrier-free journey confirmed" : "Contains an unconfirmed/gated station"}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 20, paddingTop: 60 },
  routeSummary: { fontSize: 20, fontWeight: "700", marginBottom: 20, color: "#111" },
  spinner: { marginTop: 40 },
  errorBox: { backgroundColor: "#fdeaea", borderRadius: 10, padding: 16 },
  errorText: { color: "#b3261e" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#111" },
  emptyHint: { fontSize: 14, color: "#666" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1a7f3c", textTransform: "uppercase", marginBottom: 6 },
  duration: { fontSize: 24, fontWeight: "700", color: "#111" },
  changes: { fontSize: 14, color: "#666", marginBottom: 12 },
  stationsList: { marginBottom: 14 },
  stationRow: { paddingVertical: 6 },
  stationName: { fontSize: 15, color: "#222" },
  footerRow: { gap: 8 },
  confirmationLabel: { fontSize: 13, color: "#444" },
});
