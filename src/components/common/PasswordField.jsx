import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function PasswordField({
  label,
  value,
  onChangeText,
  error,
  helperText,
  placeholder = "••••••••",
  containerClassName = "mb-4",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View className={containerClassName}>
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <View
        className={`h-13 flex-row items-center rounded-xl border bg-[#17191C] px-4 ${error ? "border-[#F08A93]" : "border-[#30363D]"}`}
      >
        <Ionicons name="lock-closed-outline" size={19} color="#8B949E" />
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          className="h-full flex-1 px-3 text-white"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#69727B"
          secureTextEntry={!visible}
          value={value}
          {...inputProps}
        />
        <Pressable
          accessibilityLabel={
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          hitSlop={4}
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={21}
            color="#8B949E"
          />
        </Pressable>
      </View>
      {!!helperText && (
        <Text className="mt-2 text-xs text-[#8B949E]">{helperText}</Text>
      )}
      {!!error && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-xs text-[#F08A93]"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
