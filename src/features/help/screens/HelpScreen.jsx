import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    icon: "calendar-outline",
    title: "Reservas y cancelaciones",
    text: "Antes de reservar se muestran cancha, horario, precio y plazo de cancelación. Podés cancelar una reserva pendiente desde su detalle; una reserva pagada requiere coordinación con el complejo.",
  },
  {
    icon: "card-outline",
    title: "Pagos",
    text: "Fulbito registra el estado del pago, pero el cobro se coordina con el complejo. Sólo el dueño o administrador puede marcar una reserva como pagada.",
  },
  {
    icon: "people-outline",
    title: "Buscar rival",
    text: "Necesitás un teléfono en tu perfil. Podés publicar una reserva futura o hasta seis franjas horarias y cerrar la búsqueda cuando completes el equipo.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Privacidad y cuenta",
    text: "Tu teléfono sólo se comparte cuando participás en Buscar rival. Al eliminar la cuenta se anonimizan tus datos personales y se conserva el historial operativo necesario.",
  },
  {
    icon: "business-outline",
    title: "Ayuda para complejos",
    text: "Configurá primero la información del complejo, luego canchas, horarios y fotos. La agenda permite buscar reservas, crear reservas manuales, registrar pagos y bloqueos.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-[#17191C]" edges={["top"]}>
      <View className="flex-row items-center px-5 pb-4 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="mr-4 h-12 w-12 items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">
            Ayuda y privacidad
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Respuestas rápidas sobre Fulbito
          </Text>
        </View>
      </View>
      <ScrollView contentContainerClassName="px-5 pb-12">
        {SECTIONS.map((section) => (
          <View
            key={section.title}
            className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
                <Ionicons name={section.icon} size={21} color="#80D160" />
              </View>
              <Text className="flex-1 text-lg font-semibold text-white">
                {section.title}
              </Text>
            </View>
            <Text className="mt-3 text-sm leading-6 text-[#C5CBD1]">
              {section.text}
            </Text>
          </View>
        ))}
        <View className="mt-2 rounded-2xl border border-[#315C3B] bg-[#142019] p-4">
          <Text className="font-semibold text-[#80D160]">
            ¿Necesitás asistencia?
          </Text>
          <Text className="mt-2 text-sm leading-6 text-[#B7D7AF]">
            Pedile al administrador del complejo que revise tu reserva indicando
            fecha, hora y cancha. Nunca compartas tu contraseña ni el código de
            acceso de tu dispositivo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
