import { phoneValidationMessage, splitPhone } from "../CountryPhoneField";

describe("phone helpers", () => {
  test("validates Uruguay numbers without the leading zero", () => {
    expect(phoneValidationMessage("+59899123456")).toBeNull();
    expect(phoneValidationMessage("+598099123456")).toMatch(/8 dígitos/);
  });

  test("uses a sensible default for shared +1 prefixes", () => {
    const result = splitPhone("+12025550123");
    expect(result.country.name).toBe("Estados Unidos");
    expect(result.nationalNumber).toBe("2025550123");
  });

  test("preserves an explicitly selected country sharing the prefix", () => {
    const result = splitPhone("+18685550123", {
      name: "Trinidad y Tobago",
      dialCode: "+1",
    });
    expect(result.country.name).toBe("Trinidad y Tobago");
  });
});
