import { angleDifference } from "./angle-utils";
import type { Point, Vector } from "./point";

type Ray = {
    angle: number;
    radius: number;
};

type ReadonlyRay = {
    readonly angle: number;
    readonly radius: number;
};

function computeRayPoint(ray: Ray): Point {
    return {
        x: ray.radius * Math.cos(ray.angle),
        y: ray.radius * Math.sin(ray.angle),
    };
}

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

function computeNormal(ray1: Ray, ray2: Ray): Vector {
    const point1 = computeRayPoint(ray1);
    const point2 = computeRayPoint(ray2);

    const normal = {
        x: -(point2.y - point1.y),
        y: point2.x - point1.x,
    };
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    normal.x /= length;
    normal.y /= length;

    if (point1.x * normal.x + point1.y * normal.y < 0) {
        normal.x *= -1;
        normal.y *= -1;
    }
    return normal;
}

export type {
    Ray,
    ReadonlyRay,
};
export {
    computeDeltaAngle,
    computeDistance,
    computeDistanceSquared,
    computeNormal,
};


