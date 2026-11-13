import { thaiHoaPlan } from './plan_spec.js';

const floorOffset = -thaiHoaPlan.nen_be.cao_do_san_dai_trieu_m;

export function planToScene(point) {
  return { x: point.x, y: point.y + floorOffset, z: -point.z };
}

export function sceneToPlan(point) {
  return { x: point.x, y: point.y - floorOffset, z: -point.z };
}

export function planDirectionToScene(vector) {
  return { x: vector.x, y: vector.y, z: -vector.z };
}
