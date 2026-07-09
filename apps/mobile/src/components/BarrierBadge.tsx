import { StyleSheet, Text, View } from "react-native";
import type { BarrierStatus } from "../api/types";

const LABELS: Record<BarrierStatus, string> = {
  OPEN_ACCESS: "✅ Open access",
  GATED: "🚧 Ticket barriers",
  MIXED: "⚠️ Mixed access",
  UNKNOWN: "❔ Unverified",
};

const COLORS: Record<BarrierStatus, { bg: string; fg: string }> = {
  OPEN_ACCESS: { bg: "#e6f7ec", fg: "#1a7f3c" },
  GATED: { bg: "#fdeaea", fg: "#b3261e" },
  MIXED: { bg: "#fff4e0", fg: "#8a5a00" },
  UNKNOWN: { bg: "#eeeeee", fg: "#555555" },
};

export function BarrierBadge({ status }: { status: BarrierStatus }) {
  const colors = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
