import { validateUploadUrl } from "../cloudinary";

describe("Cloudinary upload destination", () => {
  test.each([
    "https://api.cloudinary.com/v1_1/demo/image/upload",
    "https://api-eu.cloudinary.com/v1_1/demo/image/upload",
    "https://api-ap.cloudinary.com/v1_1/demo/image/upload",
  ])("accepts an official HTTPS upload host", (url) => {
    expect(validateUploadUrl(url)).toBe(url);
  });

  test.each([
    "http://api.cloudinary.com/v1_1/demo/image/upload",
    "https://cloudinary.example/v1_1/demo/image/upload",
    "https://api.cloudinary.com.evil.example/upload",
    "not-a-url",
  ])("rejects an untrusted destination", (url) => {
    expect(() => validateUploadUrl(url)).toThrow();
  });
});
