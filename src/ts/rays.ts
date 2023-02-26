import { normalizeAngle } from "./utils";

type Ray = {
    radius: number;
    angle: number;
};

function computeDeltaAngle(ray1: Ray, ray2: Ray): number {
    const angle1 = normalizeAngle(ray1.angle);
    const angle2 = normalizeAngle(ray2.angle);

    const rawDifference = angle2 - angle1;
    return Math.min(normalizeAngle(rawDifference), normalizeAngle(-rawDifference));
}

function computeDistanceSquared(ray1: Ray, ray2: Ray): number {
    let deltaAngle = computeDeltaAngle(ray1, ray2);
    return (ray1.radius * ray1.radius) + (ray2.radius * ray2.radius) - 2 * ray1.radius * ray2.radius * Math.cos(deltaAngle);
}

function computeDistance(ray1: Ray, ray2: Ray): number {
    return Math.sqrt(computeDistanceSquared(ray1, ray2));
}

export type {
    Ray,
};
export {
    computeDeltaAngle,
    computeDistance,
    computeDistanceSquared,
};


