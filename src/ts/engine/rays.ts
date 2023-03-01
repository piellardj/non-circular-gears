import { angleDifference } from "./angle-utils";

type Ray = {
    angle: number;
    radius: number;
};

function computeDeltaAngle(ray1: Ray, ray2: Ray): number {
    return angleDifference(ray1.angle, ray2.angle);
}

function computeDistanceSquared(ray1: Ray, ray2: Ray): number {
    const deltaAngle = computeDeltaAngle(ray1, ray2);
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


