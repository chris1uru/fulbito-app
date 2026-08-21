import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert as NativeAlert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

let showAlert = null;

export const AppAlert = {
  alert(title, message, buttons, options) {
    const alertButtons = buttons?.length ? buttons : [{ text: "Aceptar" }];
    const configuration = {
      title: String(title ?? ""),
      message: message == null ? "" : String(message),
      buttons: alertButtons,
      options: options ?? {},
    };

    if (showAlert) {
      showAlert(configuration);
      return;
    }

    NativeAlert.alert(title, message, buttons, options);
  },
};

function buttonColors(button) {
  const destructive = button.style === "destructive";
  const redCancel =
    button.style === "cancel" && /cancelar/i.test(button.text ?? "");

  if (destructive || redCancel) {
    return {
      backgroundColor: "#2B2225",
      borderColor: "#653B40",
      textColor: "#F08A93",
    };
  }

  if (button.style === "cancel") {
    return {
      backgroundColor: "#292D32",
      borderColor: "#3B4249",
      textColor: "#C5CBD1",
    };
  }

  return {
    backgroundColor: "#80D160",
    borderColor: "#80D160",
    textColor: "#152012",
  };
}

export default function AppAlertProvider({ children }) {
  const { bottom } = useSafeAreaInsets();
  const [configuration, setConfiguration] = useState(null);

  useEffect(() => {
    showAlert = setConfiguration;
    return () => {
      showAlert = null;
    };
  }, []);

  function pressButton(button) {
    setConfiguration(null);
    button.onPress?.();
  }

  function requestClose() {
    if (!configuration) return;
    const cancelButton = configuration.buttons.find(
      (button) => button.style === "cancel",
    );
    if (cancelButton) {
      pressButton(cancelButton);
      return;
    }
    if (configuration.options.cancelable) {
      setConfiguration(null);
      configuration.options.onDismiss?.();
    }
  }

  const destructive = configuration?.buttons.some(
    (button) => button.style === "destructive",
  );
  const verticalButtons = (configuration?.buttons.length ?? 0) > 2;

  return (
    <>
      {children}
      <Modal
        visible={!!configuration}
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={requestClose}
      >
        <View
          className="flex-1 items-center justify-center px-5"
          style={{
            paddingBottom: Math.max(bottom, 16),
            backgroundColor: "rgba(0, 0, 0, 0.72)",
          }}
        >
          {configuration && (
            <View
              className="w-full overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428] p-5"
              style={{ maxWidth: 380 }}
            >
              <View className="flex-row items-start">
                <View
                  className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl ${
                    destructive ? "bg-[#3A292D]" : "bg-[#2C4930]"
                  }`}
                >
                  <Ionicons
                    name={destructive ? "warning-outline" : "football-outline"}
                    size={23}
                    color={destructive ? "#F08A93" : "#80D160"}
                  />
                </View>
                <View className="flex-1 pt-1">
                  <Text className="text-xl font-bold text-white">
                    {configuration.title}
                  </Text>
                  {!!configuration.message && (
                    <Text className="mt-2 text-sm leading-5 text-[#C5CBD1]">
                      {configuration.message}
                    </Text>
                  )}
                </View>
              </View>

              <View
                className={`mt-5 ${verticalButtons ? "gap-2" : "flex-row gap-3"}`}
              >
                {configuration.buttons.map((button, index) => {
                  const colors = buttonColors(button);
                  return (
                    <Pressable
                      key={`${button.text ?? "Acción"}-${index}`}
                      accessibilityRole="button"
                      onPress={() => pressButton(button)}
                      className={`min-h-12 items-center justify-center rounded-xl border px-4 py-3 ${
                        verticalButtons ? "w-full" : "flex-1"
                      }`}
                      style={{
                        backgroundColor: colors.backgroundColor,
                        borderColor: colors.borderColor,
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        className="text-center font-semibold"
                        style={{ color: colors.textColor }}
                      >
                        {button.text ?? "Aceptar"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
