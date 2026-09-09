import { Ionicons } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { imagesApi } from "../../../services/api";
import { uploadToCloudinary } from "../../../services/cloudinary";

const MAX_VENUE_IMAGES = 8;
const MAX_COURT_IMAGES = 5;
const MAX_DIMENSION = 1600;

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function optimizeImage(asset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const largestSide = Math.max(asset.width ?? 0, asset.height ?? 0);

  if (largestSide > MAX_DIMENSION) {
    if (asset.width >= asset.height) {
      context.resize({ width: MAX_DIMENSION, height: null });
    } else {
      context.resize({ width: null, height: MAX_DIMENSION });
    }
  }

  const rendered = await context.renderAsync();
  return rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
}

export default function ImageManagementScreen() {
  const params = useLocalSearchParams();
  const target = single(params.target) === "court" ? "court" : "venue";
  const targetId = single(params.targetId);
  const targetName =
    single(params.targetName) ?? (target === "venue" ? "Complejo" : "Cancha");
  const isVenue = target === "venue";
  const maximum = isVenue ? MAX_VENUE_IMAGES : MAX_COURT_IMAGES;
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [failedAssets, setFailedAssets] = useState([]);
  const cancelRequested = useRef(false);

  const load = useCallback(async () => {
    if (!targetId) {
      setError("No se indicó qué complejo o cancha querés administrar.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const values = isVenue
        ? await imagesApi.venueList(targetId)
        : await imagesApi.courtList(targetId);
      setImages(values);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [isVenue, targetId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function uploadAssets(selected) {
    const nextOrder = images.reduce(
      (highest, image) => Math.max(highest, Number(image.sortOrder) + 1),
      0,
    );
    let uploadedCount = images.length;
    const failures = [];

    cancelRequested.current = false;
    setFailedAssets([]);
    setUploading(true);
    try {
      for (const [index, asset] of selected.entries()) {
        if (cancelRequested.current) {
          failures.push(
            ...selected.slice(index).map((pendingAsset) => ({
              asset: pendingAsset,
              message: "Carga pausada",
            })),
          );
          break;
        }
        try {
          setProgress(`Preparando ${index + 1} de ${selected.length}...`);
          const optimized = await optimizeImage(asset);
          const preparation = isVenue
            ? await imagesApi.prepareVenue(targetId)
            : await imagesApi.prepareCourt(targetId);

          setProgress(`Subiendo ${index + 1} de ${selected.length}...`);
          const proof = await uploadToCloudinary(preparation, optimized);
          const request = {
            ...proof,
            sortOrder: nextOrder + uploadedCount - images.length,
            ...(isVenue ? { cover: uploadedCount === 0 } : {}),
          };

          if (isVenue) await imagesApi.addVenue(targetId, request);
          else await imagesApi.addCourt(targetId, request);
          uploadedCount += 1;
        } catch (uploadError) {
          failures.push({ asset, message: uploadError.message });
        }
      }

      await load();
      setFailedAssets(failures);
      const completed = selected.length - failures.length;
      if (failures.length) {
        Alert.alert(
          cancelRequested.current ? "Carga pausada" : "Carga incompleta",
          `${completed} ${completed === 1 ? "foto quedó guardada" : "fotos quedaron guardadas"}. Podés reintentar las ${failures.length} pendientes sin volver a elegirlas.`,
        );
      } else {
        Alert.alert(
          selected.length === 1 ? "Foto subida" : "Fotos subidas",
          `${selected.length} ${selected.length === 1 ? "imagen quedó" : "imágenes quedaron"} disponibles.`,
        );
      }
    } finally {
      setUploading(false);
      setProgress("");
      cancelRequested.current = false;
    }
  }

  async function chooseAndUpload() {
    const remaining = maximum - images.length;
    if (remaining <= 0) {
      Alert.alert(
        "Límite alcanzado",
        `Podés guardar hasta ${maximum} fotos por ${isVenue ? "complejo" : "cancha"}.`,
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    await uploadAssets(result.assets.slice(0, remaining));
  }

  function confirmDelete(image) {
    Alert.alert(
      "Eliminar foto",
      "Se eliminará también de Cloudinary. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (isVenue) await imagesApi.deleteVenue(image.id);
              else await imagesApi.deleteCourt(image.id);
              await load();
            } catch (requestError) {
              Alert.alert("No se pudo eliminar", requestError.message);
            }
          },
        },
      ],
    );
  }

  async function setCover(image) {
    try {
      await imagesApi.setVenueCover(image.id);
      await load();
    } catch (requestError) {
      Alert.alert("No se pudo cambiar la portada", requestError.message);
    }
  }

  async function moveImage(image, nextIndex) {
    if (nextIndex < 0 || nextIndex >= images.length || uploading) return;
    const previous = images;
    const optimistic = [...images];
    const currentIndex = optimistic.findIndex((value) => value.id === image.id);
    optimistic.splice(currentIndex, 1);
    optimistic.splice(nextIndex, 0, image);
    setImages(optimistic);
    try {
      const values = isVenue
        ? await imagesApi.reorderVenue(image.id, nextIndex)
        : await imagesApi.reorderCourt(image.id, nextIndex);
      setImages([...values].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (requestError) {
      setImages(previous);
      Alert.alert("No se pudo cambiar el orden", requestError.message);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#17191C" }}
      edges={["top"]}
    >
      <View className="flex-row items-center px-5 pb-4 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          accessibilityState={{ disabled: uploading }}
          onPress={() => router.back()}
          disabled={uploading}
          className="mr-4 h-11 w-11 items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">
            {isVenue ? "Fotos del complejo" : "Fotos de la cancha"}
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">{targetName}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#80D160" size="large" />
          <Text className="mt-3 text-[#A9B1B8]">Cargando fotos...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color="#F08A93" />
          <Text className="mt-4 text-center text-white">{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: uploading || images.length >= maximum,
            }}
            onPress={() => load()}
            className="mt-5 rounded-xl bg-[#80D160] px-5 py-3"
          >
            <Text className="font-semibold text-[#152012]">Reintentar</Text>
          </Pressable>

          {uploading && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                cancelRequested.current = true;
                setProgress("Deteniendo después de esta foto...");
              }}
              className="mt-3 min-h-12 items-center justify-center rounded-xl border border-[#653B40] bg-[#2B2225]"
            >
              <Text className="font-semibold text-[#F08A93]">
                Detener carga
              </Text>
            </Pressable>
          )}

          {!uploading && failedAssets.length > 0 && (
            <View
              accessibilityLiveRegion="polite"
              className="mt-3 rounded-2xl border border-[#653B40] bg-[#2B2225] p-4"
            >
              <Text className="font-semibold text-white">
                {failedAssets.length}{" "}
                {failedAssets.length === 1
                  ? "foto pendiente"
                  : "fotos pendientes"}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-[#F08A93]">
                Las fotos ya guardadas no se volverán a subir.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  uploadAssets(failedAssets.map((item) => item.asset))
                }
                className="mt-3 min-h-12 items-center justify-center rounded-xl bg-[#80D160]"
              >
                <Text className="font-semibold text-[#152012]">
                  Reintentar pendientes
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-5 pb-12">
          <View className="rounded-2xl border border-[#315C3B] bg-[#142019] p-4">
            <View className="flex-row items-center justify-between">
              <View className="mr-4 flex-1">
                <Text className="font-semibold text-white">
                  {images.length} de {maximum} fotos
                </Text>
                <Text className="mt-1 text-xs leading-5 text-[#B7D7AF]">
                  Se reducen a 1600 px y se comprimen antes de subir para
                  ahorrar datos y espacio.
                </Text>
              </View>
              <Ionicons name="cloud-done-outline" size={28} color="#80D160" />
            </View>
          </View>

          <Pressable
            onPress={chooseAndUpload}
            disabled={uploading || images.length >= maximum}
            className={`mt-4 flex-row items-center justify-center rounded-xl py-4 ${
              uploading || images.length >= maximum
                ? "bg-[#343A40]"
                : "bg-[#80D160]"
            }`}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name="images-outline"
                size={21}
                color={images.length >= maximum ? "#8B949E" : "#152012"}
              />
            )}
            <Text
              className={`ml-2 font-semibold ${
                images.length >= maximum ? "text-[#8B949E]" : "text-[#152012]"
              }`}
            >
              {uploading
                ? progress
                : images.length >= maximum
                  ? "Límite alcanzado"
                  : "Elegir fotos"}
            </Text>
          </Pressable>

          {images.length === 0 ? (
            <View className="mt-5 items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <Ionicons name="image-outline" size={44} color="#69727B" />
              <Text className="mt-4 text-lg font-semibold text-white">
                Todavía no hay fotos
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#8B949E]">
                Agregá imágenes claras y actuales para que los jugadores
                conozcan el lugar antes de reservar.
              </Text>
            </View>
          ) : (
            <View className="mt-5 flex-row flex-wrap justify-between">
              {images.map((image, index) => (
                <View
                  key={image.id}
                  style={{ width: "48%" }}
                  className="mb-4 overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]"
                >
                  <Image
                    source={{ uri: image.url }}
                    className="h-32 w-full"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-[#8B949E]">
                        Foto {index + 1}
                      </Text>
                      {image.cover && (
                        <View className="rounded-full bg-[#2C4930] px-2 py-1">
                          <Text className="text-[10px] font-semibold text-[#80D160]">
                            Portada
                          </Text>
                        </View>
                      )}
                    </View>

                    {isVenue && !image.cover && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Usar foto ${index + 1} como portada`}
                        onPress={() => setCover(image)}
                        disabled={uploading}
                        className="mt-3 flex-row items-center"
                      >
                        <Ionicons
                          name="star-outline"
                          size={16}
                          color="#80D160"
                        />
                        <Text className="ml-1 text-xs font-semibold text-[#80D160]">
                          Usar de portada
                        </Text>
                      </Pressable>
                    )}

                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Mover foto ${index + 1} hacia atrás`}
                        accessibilityState={{
                          disabled: uploading || index === 0,
                        }}
                        disabled={uploading || index === 0}
                        onPress={() => moveImage(image, index - 1)}
                        className={`h-11 flex-1 items-center justify-center rounded-lg border border-[#3B4249] ${index === 0 ? "opacity-40" : ""}`}
                      >
                        <Ionicons name="arrow-back" size={17} color="#C5CBD1" />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Mover foto ${index + 1} hacia adelante`}
                        accessibilityState={{
                          disabled: uploading || index === images.length - 1,
                        }}
                        disabled={uploading || index === images.length - 1}
                        onPress={() => moveImage(image, index + 1)}
                        className={`h-11 flex-1 items-center justify-center rounded-lg border border-[#3B4249] ${index === images.length - 1 ? "opacity-40" : ""}`}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={17}
                          color="#C5CBD1"
                        />
                      </Pressable>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar foto ${index + 1}`}
                      onPress={() => confirmDelete(image)}
                      disabled={uploading}
                      className="mt-3 flex-row items-center"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#F08A93"
                      />
                      <Text className="ml-1 text-xs font-semibold text-[#F08A93]">
                        Eliminar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
