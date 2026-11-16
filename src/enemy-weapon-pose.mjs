/** Physical weapon mounts for the seven generic enemies with painted bodies.
 * Image readiness is deliberately absent: simulation, telegraph, vector fallback
 * and painted rendering all share this transform. Coordinates use the existing
 * collision-centred bodies; no hitbox is enlarged to fit an illustration.
 */
const rig = (width, height, pivotX, pivotY, length) => Object.freeze({
  size: Object.freeze([width, height]), pivot: Object.freeze([pivotX, pivotY]), length,
});

export const ENEMY_WEAPON_RIGS = Object.freeze({
  rifle: rig(24, 36, 3, -3, 22),
  sniper: rig(28, 38, 4, -4, 29),
  rocket: rig(26, 38, 3, -7, 26),
  buggy: rig(85, 44, 4, -17, 34),
  skimmer: rig(96, 42, 8, -14, 40),
  drone: rig(48, 26, 0, 7, 20),
  turret: rig(58, 70, 0, -17, 45),
});

const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;

/** Return fresh world coordinates. A resting weapon follows body facing; an
 * attack/recovery weapon keeps the last real targeting point. Firing can request
 * aiming explicitly without changing the entity's state or timing.
 */
export function enemyWeaponPose(enemy, { aiming = ['attack', 'recover'].includes(enemy?.phase) } = {}) {
  const spec = ENEMY_WEAPON_RIGS[enemy?.type];
  if (!spec || !Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return null;
  const facing = enemy.facing === 1 ? 1 : -1;
  const scaleX = positive(enemy.w, spec.size[0]) / spec.size[0];
  const scaleY = positive(enemy.h, spec.size[1]) / spec.size[1];
  const pivot = [enemy.x + facing * spec.pivot[0] * scaleX, enemy.y + spec.pivot[1] * scaleY];
  const hasTarget = aiming && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetY)
    && Math.hypot(enemy.targetX - pivot[0], enemy.targetY - pivot[1]) > 1e-9;
  const angle = hasTarget ? Math.atan2(enemy.targetY - pivot[1], enemy.targetX - pivot[0]) : facing === 1 ? 0 : Math.PI;
  const length = spec.length * scaleX;
  return { type: enemy.type, facing, pivot, angle, length,
    muzzle: [pivot[0] + Math.cos(angle) * length, pivot[1] + Math.sin(angle) * length],
    scale: [scaleX, scaleY], upright: Math.cos(angle) < 0 ? -1 : 1 };
}
