import {
  cancellationActorForRole,
  homeRouteForRole,
  isAdmin,
  isManager,
  isPlayer,
} from "../authorization";

describe("authorization", () => {
  test("grants only the capabilities assigned to each known role", () => {
    expect(isPlayer("PLAYER")).toBe(true);
    expect(isManager("OWNER")).toBe(true);
    expect(isManager("ADMIN")).toBe(true);
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isPlayer("OWNER")).toBe(false);
  });

  test("fails closed for unknown or missing roles", () => {
    for (const role of [undefined, null, "", "SUPPORT", "admin"]) {
      expect(isPlayer(role)).toBe(false);
      expect(isManager(role)).toBe(false);
      expect(isAdmin(role)).toBe(false);
      expect(homeRouteForRole(role)).toBe("/perfil");
      expect(cancellationActorForRole(role)).toBeNull();
    }
  });

  test("routes known roles and cancellation actions explicitly", () => {
    expect(homeRouteForRole("PLAYER")).toBe("/maps");
    expect(homeRouteForRole("OWNER")).toBe("/reservas");
    expect(homeRouteForRole("ADMIN")).toBe("/reservas");
    expect(cancellationActorForRole("PLAYER")).toBe("PLAYER");
    expect(cancellationActorForRole("OWNER")).toBe("MANAGER");
    expect(cancellationActorForRole("ADMIN")).toBe("MANAGER");
  });
});
