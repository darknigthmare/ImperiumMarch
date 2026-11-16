/** Cerbère's existing collision-centred gun contract, independent of artwork.
 * The muzzle is the legacy e.w / 2 from [e.x,e.y]. Sharing these exact values
 * fixes the old visual offset without changing projectile travel or damage. */
export function cerbereWeaponPose(enemy, { aiming = ['attack', 'recover'].includes(enemy?.phase) } = {}) {
  if (enemy?.type !== 'boss' || !Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return null;
  const facing = enemy.facing === 1 ? 1 : -1;
  const width = Number.isFinite(enemy.w) && enemy.w > 0 ? enemy.w : 178;
  const hasTarget = aiming && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetY);
  const angle = hasTarget ? Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x) : facing === 1 ? 0 : Math.PI;
  const length = width / 2, pivot = [enemy.x, enemy.y];
  return { pivot, angle, length, facing, muzzle: [enemy.x + Math.cos(angle) * length, enemy.y + Math.sin(angle) * length],
    scale: width / 178, upright: Math.cos(angle) < 0 ? -1 : 1 };
}
