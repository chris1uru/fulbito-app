export const USER_ROLES = Object.freeze({
  PLAYER: "PLAYER",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
});

export function isPlayer(role) {
  return role === USER_ROLES.PLAYER;
}

export function isManager(role) {
  return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN;
}

export function isAdmin(role) {
  return role === USER_ROLES.ADMIN;
}

export function homeRouteForRole(role) {
  if (isPlayer(role)) return "/maps";
  if (isManager(role)) return "/reservas";
  return "/perfil";
}

export function cancellationActorForRole(role) {
  if (isPlayer(role)) return "PLAYER";
  if (isManager(role)) return "MANAGER";
  return null;
}
