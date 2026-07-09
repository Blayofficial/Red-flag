import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getStation, ApiError } from "../api/client";
import type { Station } from "../api/types";
import { BarrierBadge } from "../components/BarrierBadge";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "StationDetails">;

export function StationDetailsScreen({ route }: Props) {
  const { stationId } = route.params;
  const [station, setStation] = useState<Station | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getStation(stationId)
      .then(({ station }) => {
        if (!cancelled) setStation(station);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  if (loading) {
    return <ActivityIndicator style={styles.spinner} size="large" />;
  }

  if (error || !station) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error ?? "Station not found."}</Text>
      </View>
    );
  }

  const barrier = station.barrier;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{station.name}</Text>
      <Text style={styles.meta}>
        {station.operator ?? "Unknown operator"} · {station.transportMode}
      </Text>
      {station.lines.length > 0 && <Text style={styles.lines}>{station.lines.join(", ")}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Barrier status</Text>
        {barrier ? (
          <BarrierBadge status={barrier.status} />
        ) : (
          <Text style={styles.noData}>No barrier data recorded for this station yet.</Text>
        )}
      </View>

      {barrier && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Confidence score</Text>
            <Text style={styles.confidence}>{Math.round(barrier.confidenceScore * 100)}%</Text>
          </View>

          {barrier.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text style={styles.notes}>{barrier.notes}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Data source{barrier.sources.length > 1 ? "s" : ""}</Text>
            {barrier.sources.length === 0 && <Text style={styles.noData}>No source recorded.</Text>}
            {barrier.sources.map((source, i) => (
              <View key={i} style={styles.sourceRow}>
                <Text style={styles.sourceType}>{source.type.replace(/_/g, " ")}</Text>
                {source.note && <Text style={styles.sourceNote}>{source.note}</Text>}
              </View>
            ))}
          </View>

          {barrier.needsManualReview && (
            <View style={styles.reviewBanner}>
              <Text style={styles.reviewText}>
                ⚠️ This station is flagged for manual review — treat its status as provisional.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingTop: 60 },
  spinner: { flex: 1, marginTop: 100 },
  errorText: { color: "#b3261e", fontSize: 15 },
  name: { fontSize: 26, fontWeight: "700", color: "#111" },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  lines: { fontSize: 14, color: "#444", marginTop: 4 },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 8 },
  noData: { fontSize: 14, color: "#999", fontStyle: "italic" },
  confidence: { fontSize: 22, fontWeight: "700", color: "#111" },
  notes: { fontSize: 14, color: "#333", lineHeight: 20 },
  sourceRow: { marginBottom: 10 },
  sourceType: { fontSize: 14, fontWeight: "600", color: "#111", textTransform: "capitalize" },
  sourceNote: { fontSize: 13, color: "#666", marginTop: 2 },
  reviewBanner: { marginTop: 28, backgroundColor: "#fff4e0", borderRadius: 10, padding: 14 },
  reviewText: { color: "#8a5a00", fontSize: 13 },
});
