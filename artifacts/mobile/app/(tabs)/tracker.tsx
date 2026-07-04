import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import {
  APPLICATION_STATUSES,
  APPLICATION_XP,
  ApplicationStatus,
  getStatusMeta,
  JobApplication,
} from "@/data/content";

function StatusPill({ status }: { status: ApplicationStatus }) {
  const meta = getStatusMeta(status);
  return (
    <View style={[styles.statusPill, { backgroundColor: meta.color + "22" }]}>
      <Ionicons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function TrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, addApplication, updateApplication, deleteApplication } = useGame();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const apps = state.applications;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of APPLICATION_STATUSES) c[s.id] = 0;
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [apps]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setCompany("");
    setRole("");
    setNotes("");
    setStatus("applied");
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((app: JobApplication) => {
    setEditing(app);
    setCompany(app.company);
    setRole(app.role);
    setNotes(app.notes ?? "");
    setStatus(app.status);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (company.trim().length === 0 || role.trim().length === 0) {
      Alert.alert("Missing info", "Please enter both a company and a role.");
      return;
    }
    if (editing) {
      await updateApplication(editing.id, { company, role, notes, status });
    } else {
      await addApplication(company, role, status, notes);
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setModalVisible(false);
  }, [company, role, notes, status, editing, addApplication, updateApplication]);

  const handleDelete = useCallback(
    (app: JobApplication) => {
      Alert.alert("Delete application?", `Remove ${app.role} at ${app.company}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }
            deleteApplication(app.id);
          },
        },
      ]);
    },
    [deleteApplication]
  );

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { color: colors.primary }]}>Application Tracker</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Each one you log plants new life in your pond · +{APPLICATION_XP} XP
            </Text>
          </View>
        </View>

        {apps.length > 0 && (
          <View style={styles.summaryRow}>
            {APPLICATION_STATUSES.filter((s) => counts[s.id] > 0).map((s) => (
              <View
                key={s.id}
                style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.summaryNum, { color: s.color }]}>{counts[s.id]}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {apps.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>🪷</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No applications yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Log your first job application to start growing your garden and earning XP.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {apps.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => openEdit(app)}
                style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.appCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.appRole, { color: colors.foreground }]} numberOfLines={1}>
                      {app.role}
                    </Text>
                    <Text style={[styles.appCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {app.company}
                    </Text>
                  </View>
                  <StatusPill status={app.status} />
                </View>
                {app.notes ? (
                  <Text style={[styles.appNotes, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {app.notes}
                  </Text>
                ) : null}
                <View style={styles.appCardBottom}>
                  <Text style={[styles.appDate, { color: colors.mutedForeground }]}>
                    {new Date(app.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(app)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${app.role} at ${app.company}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={openAdd}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add application"
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 90 }]}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editing ? "Edit Application" : "New Application"}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Company</Text>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Acme Inc."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              maxLength={60}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Role</Text>
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Frontend Engineer"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              maxLength={60}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
            <View style={styles.statusRow}>
              {APPLICATION_STATUSES.map((s) => {
                const selected = s.id === status;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setStatus(s.id)}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: selected ? s.color : colors.background,
                        borderColor: selected ? s.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusChipText, { color: selected ? "#fff" : colors.foreground }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Recruiter name, next steps…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              multiline
              maxLength={200}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>
                  {editing ? "Save" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "flex-start" },
  appName: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: {
    flexGrow: 1,
    minWidth: 70,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  summaryNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
    marginTop: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  list: { gap: 12 },
  appCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  appCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  appRole: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  appCompany: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  appNotes: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  appCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  appDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  notesInput: { minHeight: 64, textAlignVertical: "top" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  statusChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  cancelBtn: { borderWidth: 1 },
  confirmBtn: {},
  modalBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
