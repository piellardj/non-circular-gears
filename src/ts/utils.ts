import { Point } from "./engine/point";

function distanceSquared(p1: Point, p2: Point): number {
    const dX = p1.x - p2.x;
    const dY = p1.y - p2.y;
    return dX * dX + dY * dY;
}

function distance(p1: Point, p2: Point): number {
    const squared = distanceSquared(p1, p2);
    return Math.sqrt(squared);
}

export {
    distance,
    distanceSquared,
};

