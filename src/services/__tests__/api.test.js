import { encodePathId, setApiToken, venuesApi } from "../api";

const VALID_ID = "3d594650-3436-4e56-8657-172d3f2a89f3";

function okResponse(data = []) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(data),
  };
}

describe("API request safety", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(okResponse());
    setApiToken("private-token");
  });

  afterEach(() => setApiToken(null));

  test("rejects malformed path identifiers before sending a request", async () => {
    expect(() => encodePathId("../admin", "complejo")).toThrow(
      "No se pudo identificar el complejo.",
    );
    expect(() => venuesApi.publicOne("not-a-uuid")).toThrow(
      "No se pudo identificar el complejo.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test("does not expose the bearer token to public endpoints", async () => {
    await venuesApi.publicList();
    const options = fetch.mock.calls[0][1];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test("keeps the bearer token on authenticated endpoints", async () => {
    await venuesApi.adminOne(VALID_ID);
    const options = fetch.mock.calls[0][1];
    expect(options.headers.Authorization).toBe("Bearer private-token");
  });
});
