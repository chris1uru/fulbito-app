import { Platform } from "react-native";

const UPLOAD_TIMEOUT_MS = 60_000;

export async function uploadToCloudinary(preparation, image) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  const body = new FormData();

  try {
    if (Platform.OS === "web") {
      const blob = await fetch(image.uri).then((response) => response.blob());
      body.append("file", blob, `fulbito-${Date.now()}.jpg`);
    } else {
      body.append("file", {
        uri: image.uri,
        name: `fulbito-${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }

    body.append("api_key", preparation.apiKey);
    body.append("timestamp", String(preparation.timestamp));
    body.append("signature", preparation.signature);
    body.append("folder", preparation.folder);
    body.append("public_id", preparation.publicId);
    body.append("overwrite", String(preparation.overwrite));

    const response = await fetch(preparation.uploadUrl, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error?.message ?? "Cloudinary rechazó la imagen seleccionada.",
      );
    }

    if (!data?.public_id || !data?.version || !data?.signature) {
      throw new Error("Cloudinary devolvió una respuesta incompleta.");
    }

    return {
      publicId: data.public_id,
      version: Number(data.version),
      signature: data.signature,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "La imagen tardó demasiado en subir. Revisá tu conexión e intentá nuevamente.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
