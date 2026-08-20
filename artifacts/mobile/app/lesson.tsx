import { Ionicons } from "@expo/vector-icons";
import { notify, NotificationFeedbackType } from "@/lib/haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { MODULES, Quiz, QUIZ_XP } from "@/data/content";
import { getQuiz } from "@/data/quizzes";
import { ConfettiOverlay } from "@/components/ConfettiOverlay";

function ContentPage({
  text,
  pageIndex,
  totalPages,
  width,
}: {
  text: string;
  pageIndex: number;
  totalPages: number;
  width: number;
}) {
  const colors = useColors();
  return (
    <View style={[styles.page, { width }]}>
      <View style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.pageNum, { color: colors.mutedForeground }]}>
          {pageIndex + 1} of {totalPages}
        </Text>
        <Text style={[styles.bodyText, { color: colors.foreground }]}>{text}</Text>
      </View>
    </View>
  );
}

function TakeawayPage({
  keyTakeaway,
  tip,
  moduleColor,
  onComplete,
  isAlreadyCompleted,
  width,
}: {
  keyTakeaway: string;
  tip: string;
  moduleColor: string;
  onComplete: () => Promise<void>;
  isAlreadyCompleted: boolean;
  width: number;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const [done, setDone] = useState(isAlreadyCompleted);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  async function handleComplete() {
    if (done) {
      router.back();
      return;
    }
    scale.value = withSequence(
      withSpring(0.93, { damping: 8 }),
      withSpring(1.06, { damping: 8 }),
      withSpring(1)
    );
    notify(NotificationFeedbackType.Success);
    setDone(true);
    await onComplete();
    setTimeout(() => router.back(), 900);
  }

  return (
    <View style={[styles.page, { width }]}>
      <View style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.takeawayHeader, { backgroundColor: moduleColor + "22" }]}>
          <Ionicons name="key" size={22} color={moduleColor} />
          <Text style={[styles.takeawayLabel, { color: moduleColor }]}>Key Takeaway</Text>
        </View>
        <Text style={[styles.takeawayText, { color: colors.foreground }]}>{keyTakeaway}</Text>

        <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.tipLabel, { color: colors.mutedForeground }]}>Quick Tip</Text>
          <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
        </View>

        <Animated.View style={btnStyle}>
          <Pressable
            onPress={handleComplete}
            style={[
              styles.completeBtn,
              { backgroundColor: done ? colors.success : moduleColor },
            ]}
            testID="complete-lesson-btn"
          >
            {done ? (
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
            ) : (
              <Ionicons name="checkmark-done" size={22} color="#fff" />
            )}
            <Text style={styles.completeBtnText}>
              {done ? "Lesson Complete!" : "Complete Lesson"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function QuizPage({
  quiz,
  moduleColor,
  alreadyPassed,
  onPass,
  width,
}: {
  quiz: Quiz;
  moduleColor: string;
  alreadyPassed: boolean;
  onPass: () => Promise<void>;
  width: number;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [earned, setEarned] = useState(false);

  const isCorrect = selected === quiz.correctIndex;

  async function handleSubmit() {
    if (selected === null || revealed) return;
    setRevealed(true);
    if (selected === quiz.correctIndex) {
      notify(NotificationFeedbackType.Success);
      if (!alreadyPassed) {
        setEarned(true);
        await onPass();
      }
    } else {
      notify(NotificationFeedbackType.Warning);
    }
  }

  function handleRetry() {
    setSelected(null);
    setRevealed(false);
  }

  return (
    <View style={[styles.page, { width }]}>
      <View style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.takeawayHeader, { backgroundColor: moduleColor + "22" }]}>
          <Ionicons name="help-circle" size={22} color={moduleColor} />
          <Text style={[styles.takeawayLabel, { color: moduleColor }]}>
            Knowledge Check{alreadyPassed ? " ✓" : ` · +${QUIZ_XP} XP`}
          </Text>
        </View>
        <Text style={[styles.quizQuestion, { color: colors.foreground }]}>{quiz.question}</Text>

        <View style={styles.quizOptions}>
          {quiz.options.map((option, i) => {
            const isSelected = selected === i;
            const showCorrect = revealed && i === quiz.correctIndex;
            const showWrong = revealed && isSelected && i !== quiz.correctIndex;
            let borderColor = colors.border;
            let bg = colors.background;
            if (showCorrect) {
              borderColor = colors.success;
              bg = colors.success + "1A";
            } else if (showWrong) {
              borderColor = colors.destructive;
              bg = colors.destructive + "1A";
            } else if (isSelected) {
              borderColor = moduleColor;
              bg = moduleColor + "12";
            }
            return (
              <Pressable
                key={i}
                onPress={() => !revealed && setSelected(i)}
                style={[styles.quizOption, { borderColor, backgroundColor: bg }]}
              >
                <Text style={[styles.quizOptionText, { color: colors.foreground }]}>{option}</Text>
                {showCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                {showWrong && <Ionicons name="close-circle" size={20} color={colors.destructive} />}
              </Pressable>
            );
          })}
        </View>

        {revealed && (
          <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tipLabel, { color: isCorrect ? colors.success : colors.mutedForeground }]}>
              {isCorrect ? (earned ? `Correct! +${QUIZ_XP} XP` : "Correct!") : "Not quite"}
            </Text>
            <Text style={[styles.tipText, { color: colors.foreground }]}>{quiz.explanation}</Text>
          </View>
        )}

        {!revealed ? (
          <Pressable
            onPress={handleSubmit}
            disabled={selected === null}
            style={[styles.completeBtn, { backgroundColor: moduleColor, opacity: selected === null ? 0.4 : 1 }]}
          >
            <Text style={styles.completeBtnText}>Check Answer</Text>
          </Pressable>
        ) : !isCorrect ? (
          <Pressable onPress={handleRetry} style={[styles.completeBtn, { backgroundColor: moduleColor }]}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.completeBtnText}>Try Again</Text>
          </Pressable>
        ) : (
          <View style={[styles.completeBtn, { backgroundColor: colors.success }]}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
            <Text style={styles.completeBtnText}>Swipe for takeaway</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function LessonScreen() {
  const { moduleId, lessonId } = useLocalSearchParams<{
    moduleId: string;
    lessonId: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const {
    completeLesson,
    isLessonCompleted,
    passQuiz,
    isQuizPassed,
    state,
  } = useGame();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const module = MODULES.find((m) => m.id === moduleId);
  const lesson = module?.lessons.find((l) => l.id === lessonId);

  if (!module || !lesson) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Lesson not found</Text>
      </View>
    );
  }

  const alreadyCompleted = isLessonCompleted(lesson.id);
  const quiz = getQuiz(lesson.id);
  const quizAlreadyPassed = isQuizPassed(lesson.id);
  const contentPages = lesson.content;
  const totalPages = contentPages.length + (quiz ? 1 : 0) + 1;

  const handleComplete = useCallback(async () => {
    await completeLesson(lesson.id, module.id);
    setConfettiTrigger((t) => t + 1);
  }, [lesson.id, module.id]);

  const handleQuizPass = useCallback(async () => {
    await passQuiz(lesson.id);
  }, [lesson.id]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentIndex(idx);
    },
    [SCREEN_WIDTH]
  );

  function goNext() {
    if (currentIndex < totalPages - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      listRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  }

  type PageItem =
    | { type: "content"; text: string; index: number }
    | { type: "quiz" }
    | { type: "takeaway"; index: number };

  const pages: PageItem[] = [
    ...contentPages.map<PageItem>((text, i) => ({ type: "content", text, index: i })),
    ...(quiz ? [{ type: "quiz" } as PageItem] : []),
    { type: "takeaway", index: contentPages.length },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ConfettiOverlay trigger={confettiTrigger} />
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={[styles.lessonTitle, { color: colors.foreground }]} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={[styles.moduleName, { color: colors.mutedForeground }]}>
            {module.title}
          </Text>
        </View>
        <View style={[styles.xpPill, { backgroundColor: module.color + "22" }]}>
          <Text style={[styles.xpPillText, { color: module.color }]}>+{lesson.xp} XP</Text>
        </View>
      </View>

      <View style={styles.dotsRow}>
        {pages.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= currentIndex ? module.color : colors.muted,
                width: i === currentIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(_, i) => `page-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => {
          if (item.type === "content") {
            return (
              <ContentPage
                text={item.text}
                pageIndex={item.index}
                totalPages={totalPages}
                width={SCREEN_WIDTH}
              />
            );
          }
          if (item.type === "quiz" && quiz) {
            return (
              <QuizPage
                quiz={quiz}
                moduleColor={module.color}
                alreadyPassed={quizAlreadyPassed}
                onPass={handleQuizPass}
                width={SCREEN_WIDTH}
              />
            );
          }
          return (
            <TakeawayPage
              keyTakeaway={lesson.keyTakeaway}
              tip={lesson.tip}
              moduleColor={module.color}
              onComplete={handleComplete}
              isAlreadyCompleted={alreadyCompleted}
              width={SCREEN_WIDTH}
            />
          );
        }}
      />

      <View
        style={[styles.navRow, { paddingBottom: bottomPad + 16, backgroundColor: colors.background }]}
      >
        <Pressable
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={[
            styles.navBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            currentIndex === 0 && { opacity: 0.3 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={goNext}
          disabled={currentIndex === totalPages - 1}
          style={[
            styles.navBtnPrimary,
            { backgroundColor: module.color },
            currentIndex === totalPages - 1 && { opacity: 0.3 },
          ]}
        >
          <Text style={styles.navBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1 },
  lessonTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  moduleName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  xpPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpPillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  page: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pageCard: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    minHeight: 320,
  },
  pageNum: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bodyText: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    lineHeight: 28,
    flex: 1,
  },
  takeawayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    alignSelf: "flex-start",
  },
  takeawayLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  takeawayText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    lineHeight: 26,
  },
  tipBox: {
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  tipLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  quizQuestion: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
  },
  quizOptions: { gap: 10 },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  quizOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  completeBtn: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  completeBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  navRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  navBtnPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
