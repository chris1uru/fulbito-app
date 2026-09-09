import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";

const STEPS = [
  {
    icon: "map-outline",
    title: "Encontrá una cancha",
    detail: "Buscá por zona, fecha y hora, y compará la disponibilidad real.",
  },
  {
    icon: "calendar-outline",
    title: "Reservá con claridad",
    detail:
      "Antes de confirmar verás precio, horario y política de cancelación.",
  },
  {
    icon: "people-outline",
    title: "Completá el equipo",
    detail: "Publicá una búsqueda o sumate a otro partido desde Buscar rival.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  async function finish() {
    await completeOnboarding();
    router.replace("/maps");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#17191C] px-6 pb-6">
      <View className="flex-row justify-end pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Omitir introducción"
          onPress={finish}
          className="min-h-12 justify-center px-3"
        >
          <Text className="font-semibold text-[#A9B1B8]">Omitir</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center">
        <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-[#2C4930]">
          <Ionicons name={step.icon} size={48} color="#80D160" />
        </View>
        <Text className="mt-8 text-center text-3xl font-bold text-white">
          {step.title}
        </Text>
        <Text className="mt-3 max-w-sm text-center text-base leading-7 text-[#A9B1B8]">
          {step.detail}
        </Text>
      </View>

      <View
        className="mb-6 flex-row justify-center gap-2"
        accessibilityLabel={`Paso ${index + 1} de ${STEPS.length}`}
      >
        {STEPS.map((item, stepIndex) => (
          <View
            key={item.title}
            className={`h-2 rounded-full ${stepIndex === index ? "w-8 bg-[#80D160]" : "w-2 bg-[#3B4249]"}`}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={last ? finish : () => setIndex((current) => current + 1)}
        className="min-h-14 items-center justify-center rounded-xl bg-[#80D160]"
      >
        <Text className="text-base font-bold text-[#152012]">
          {last ? "Empezar a buscar" : "Continuar"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
