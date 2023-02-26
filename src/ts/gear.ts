import { Point } from "./point";

type Ray = {
    radius: number;
    angle: number;
};

type ReadonlyPoint = {
    readonly x: number;
    readonly y: number;
};

type ConstructionResult = {
    distance: number;
    periodRays: Ray[];
    period: number; // can be fractional
    targetPeriod: number; // integer
    error: number; // in [0, 1]
};

const TWO_PI = 2 * Math.PI;

// function normalizeAngle(angle: number): number {
//     if (angle < 0) {
//         angle += TWO_PI * Math.ceil(-angle / TWO_PI);
//     }
//     return angle % TWO_PI;
// }

class Gear {
    public static draw(context: CanvasRenderingContext2D, ...gears: Gear[]): void {
        const halfWidth = 0.5 * context.canvas.width;
        const halfHeight = 0.5 * context.canvas.height;
        const factor = Math.min(halfWidth, halfHeight);

        function normalize(point: Point): void {
            point.x = halfWidth + factor * point.x;
            point.y = halfHeight + factor * point.y;
        }

        // draw body
        {
            context.fillStyle = "rgba(255,0,0,0.3)";
            context.strokeStyle = "red";

            for (const gear of gears) {
                context.beginPath();
                gear.rays.forEach((ray: Ray, index: number) => {
                    const point = {
                        x: gear.center.x + ray.radius * Math.cos(ray.angle),
                        y: gear.center.y + ray.radius * Math.sin(ray.angle),
                    };
                    normalize(point);

                    if (index === 0) {
                        context.moveTo(point.x, point.y);
                    } else {
                        context.lineTo(point.x, point.y);
                    }
                });

                context.closePath();
                context.stroke();
                context.fill();
            }
        }

        // draw line
        {
            context.strokeStyle = "green";

            context.beginPath();
            for (const gear of gears) {
                const center = {
                    x: gear.center.x,
                    y: gear.center.y,
                };
                normalize(center);
                context.moveTo(center.x, center.y);

                const firstRay = gear.rays[0];
                if (!firstRay) {
                    throw new Error("Gear has no rays.");
                }
                const point = {
                    x: gear.center.x + firstRay.radius * Math.cos(firstRay.angle),
                    y: gear.center.y + firstRay.radius * Math.sin(firstRay.angle),
                };
                normalize(point);
                context.lineTo(point.x, point.y);
            }
            context.closePath();
            context.stroke();
        }

        // draw centers
        {
            context.fillStyle = "green";
            const radius = factor * 0.02;
            for (const gear of gears) {
                const center = { x: gear.center.x, y: gear.center.y };
                normalize(center);
                context.beginPath();
                context.arc(center.x, center.y, radius, 0, TWO_PI);
                context.closePath();
                context.fill();
            }
        }
    }

    public static circle(center: ReadonlyPoint, radius: number): Gear {
        const raysCount = 2 * 180;

        const rays: Ray[] = [];
        for (let i = 0; i < 2; i++) {
            const percentage = i / raysCount;
            const angle = TWO_PI * percentage;
            rays.push({
                radius,
                angle,
            });
        }
        return new Gear(center, rays, raysCount / 2);
    }

    public static ellipsis(center: ReadonlyPoint, a: number, b: number): Gear {
        const periodStepsCount = 180;
        const rays: Ray[] = [];
        for (let i = 0; i < periodStepsCount; i++) {
            const percentage = i / periodStepsCount;
            const angle = Math.PI * percentage;
            rays.push({
                radius: a * b / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2)),
                angle,
            });
        }

        return new Gear(center, rays, 2);
    }

    public static slaveGear(idealCenter: ReadonlyPoint, master: Gear): Gear | null {
        const dX = idealCenter.x - master.center.x;
        const dY = idealCenter.y - master.center.y;
        const idealDistance = Math.max(master.maxRadius + 0.0001, Math.sqrt(dX * dX + dY * dY));

        const adjustedDistance = Gear.getNextFittingDistance(idealDistance, master);
        const period = Gear.tryBuildCompanionPeriod(adjustedDistance, master);

        const center = { x: adjustedDistance, y: 0 };
        return new Gear(center, period.periodRays, period.targetPeriod);
    }

    private static tryBuildCompanionPeriod(distance: number, master: Gear): ConstructionResult {
        const periodRays: Ray[] = [];
        let angle = 0;
        periodRays.push({
            angle,
            radius: distance - master.periodRays[0]!.radius,
        });

        for (let i = 0; i < master.periodRays.length - 1; i++) {
            const otherRay1 = master.rays[i % master.rays.length]!;
            const otherRay2 = master.rays[(i + 1) % master.rays.length]!;

            const otherAngle1 = otherRay1.angle;
            const otherAngle2 = (i === master.periodRays.length - 1) ? TWO_PI : otherRay2.angle;
            const otherR1 = otherRay1.radius;
            const otherR2 = otherRay2.radius;
            const dOtherAngle = otherAngle2 - otherAngle1;
            const dSegmentLengthSquared = (otherR1 * otherR1) + (otherR2 * otherR2) - 2 * otherR1 * otherR2 * Math.cos(dOtherAngle);

            const r1 = distance - otherR1;
            const r2 = distance - otherR2;
            const dAngle = Math.acos((r1 * r1 + r2 * r2 - dSegmentLengthSquared) / (2 * r1 * r2));
            if (isNaN(dAngle)) {
                throw new Error("Should not happen");
            }

            angle -= dAngle;
            periodRays.push({
                angle: -angle,
                radius: r2,
            });
        }

        const lastAngle = -angle;
        const period = TWO_PI / lastAngle;
        const targetPeriod = Math.ceil(period);
        const error = targetPeriod - period;
        return {
            distance,
            periodRays,
            period,
            targetPeriod,
            error,
        };
    }

    private static getNextFittingDistance(idealDistance: number, master: Gear): number {
        const initialTry = Gear.tryBuildCompanionPeriod(idealDistance, master);

        let tooLowTry = initialTry;
        let tooHighTry = null as ConstructionResult | null;

        const maxTries = 200;
        let triesCount = 1;
        while (tooLowTry.error > 0 && triesCount < maxTries) {
            const currentDistance = tooHighTry ? 0.5 * (tooLowTry.distance + tooHighTry.distance) : tooLowTry.distance + 0.5;
            if (currentDistance === tooLowTry.distance || currentDistance === tooHighTry?.distance) {
                console.debug("Convergence");
                break;
            }

            const currentTry = Gear.tryBuildCompanionPeriod(currentDistance, master);
            if (currentTry.targetPeriod > tooLowTry.targetPeriod || currentTry.error > tooLowTry.error) {
                tooHighTry = currentTry;
            } else {
                tooLowTry = currentTry;
            }
            triesCount++;
        }

        const finalTry = tooLowTry;
        console.debug(`Final error ${finalTry.error} obtained in ${triesCount} tries. Final periodicity ${finalTry.targetPeriod}, initial was ${initialTry.targetPeriod}.`);
        return finalTry.distance;
    }

    private readonly rays: ReadonlyArray<Ray>;
    private readonly maxRadius: number;

    private constructor(
        private readonly center: ReadonlyPoint,
        private readonly periodRays: ReadonlyArray<Ray>,
        periods: number) {
        let maxRadius = -10000000000;
        periodRays.forEach(ray => {
            maxRadius = Math.max(ray.radius, maxRadius);
        });
        this.maxRadius = maxRadius;

        const rays: Ray[] = [];
        for (let iP = 0; iP < periods; iP++) {
            const periodStartingAngle = TWO_PI * iP / periods;
            periodRays.forEach(periodRay => {
                rays.push({
                    radius: periodRay.radius,
                    angle: periodStartingAngle + periodRay.angle,
                })
            });
        }
        this.rays = rays;
    }
}

export {
    Gear,
};

