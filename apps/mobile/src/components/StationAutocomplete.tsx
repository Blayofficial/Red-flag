import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { searchStations } from "../api/client";
import type { Station } from "../api/types";

const DEBOUNCE_MS = 250;

interface StationAutocompleteProps {
  label: string;
  placeholder: string;
  onSelect: (station: Station) => void;
  selectedName: string | null;
}

export function StationAutocomplete({ label, placeholder, onSelect, selectedName }: StationAutocompleteProps) {
  const [query, setQuery] = useState(selectedName ?? "");
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(selectedName ?? "");
  }, [selectedName]);

  function handleChangeText(text: string) {
    setQuery(text);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { stations } = await searchStations(text);
        setResults(stations);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(station: Station) {
    setQuery(station.name);
    setIsOpen(false);
    setResults([]);
    onSelect(station);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        autoCorrect={false}
        onFocus={() => setIsOpen(true)}
      />
      {loading && <ActivityIndicator style={styles.spinner} size="small" />}
      {isOpen && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Text style={styles.resultRow} onPress={() => handleSelect(item)}>
                {item.name}
              </Text>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  spinner: { position: "absolute", right: 12, top: 38 },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 180,
    backgroundColor: "#fff",
  },
  resultRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
});
