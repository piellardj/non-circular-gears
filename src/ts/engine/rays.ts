import { normalizeAngle, TWO_PI } from "./angle-utils";

type Ray = {
    angle: number;
    radius: number;
};

function computeDeltaAngle(ray1: Ray, ray2: Ray): number {
    const rawDifference = normalizeAngle(ray2.angle - ray1.angle);
    if (rawDifference <= Math.PI) {
        return rawDifference;
    }
    return TWO_PI - rawDifference;
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


