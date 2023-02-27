import { Point } from "./point";
import { computeDeltaAngle, computeDistance, Ray } from "./rays";
import { makeAnglePositive, normalizeAngle, TWO_PI } from "./utils";

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

type Segment = {
    deltaAngle: number;
    deltaDistance: number;
    rayFrom: Ray;
    rayTo: Ray;
};

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
                        x: gear.center.x + ray.radius * Math.cos(ray.angle + gear.rotation),
                        y: gear.center.y + ray.radius * Math.sin(ray.angle + gear.rotation),
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
                    x: gear.center.x + firstRay.radius * Math.cos(firstRay.angle + gear.rotation),
                    y: gear.center.y + firstRay.radius * Math.sin(firstRay.angle + gear.rotation),
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
            const radius = factor * 0.01;
            for (const gear of gears) {
                const center = { x: gear.center.x, y: gear.center.y };
                normalize(center);
                context.beginPath();
                context.arc(center.x, center.y, radius, 0, TWO_PI);
                context.closePath();
                context.fill();
            }
        }

        // draw text
        {
            context.fillStyle = "white";
            context.font = "16px serif";
            for (const gear of gears) {
                const text = (180 * gear.rotation / Math.PI).toFixed();
                const center = { x: gear.center.x, y: gear.center.y };
                normalize(center);
                context.fillText(text, center.x, center.y);
            }
        }
    }

    public static circle(center: ReadonlyPoint, radius: number): Gear {
        const periodCount = 60;
        const raysCount = 2 * periodCount;

        const rays: Ray[] = [];
        for (let i = 0; i < 2; i++) {
            const percentage = i / raysCount;
            const angle = TWO_PI * percentage;
            rays.push({
                angle,
                radius,
            });
        }
        return new Gear(center, rays, periodCount);
    }

    public static ellipsis(center: ReadonlyPoint, a: number, b: number): Gear {
        const periodCount = 2;
        const periodStepsCount = 60;
        const rays: Ray[] = [];
        for (let i = 0; i < periodStepsCount; i++) {
            const percentage = i / periodStepsCount;
            const angle = Math.PI * percentage;
            rays.push({
                angle,
                radius: a * b / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2)),
            });
        }
        return new Gear(center, rays, periodCount);
    }

    public static slaveGear(idealCenter: ReadonlyPoint, master: Gear): Gear | null {
        const dX = idealCenter.x - master.center.x;
        const dY = idealCenter.y - master.center.y;
        const idealDistance = Math.max(master.maxRadius + 0.01, Math.sqrt(dX * dX + dY * dY));

        const adjustedDistance = Gear.getNextFittingDistance(idealDistance, master);
        const period = Gear.tryBuildCompanionPeriod(adjustedDistance, master);

        const angle = Math.atan2(dY, dX);
        const center = {
            x: master.center.x + adjustedDistance * Math.cos(angle),
            y: master.center.y + adjustedDistance * Math.sin(angle),
        };
        const newGear = new Gear(center, period.periodRays, period.targetPeriod);
        newGear.parent = master;

        return newGear;
    }

    private static tryBuildCompanionPeriod(distance: number, master: Gear): ConstructionResult {
        const periodRays: Ray[] = [];
        let angle = 0;

        for (const periodSegment of master.iterateOnPeriodSegments()) {
            periodRays.push({
                angle: -angle,
                radius: distance - periodSegment.rayFrom.radius,
            });

            const dSegmentLengthSquared = periodSegment.deltaDistance * periodSegment.deltaDistance;

            const r1 = distance - periodSegment.rayFrom.radius;
            const r2 = distance - periodSegment.rayTo.radius;
            const dAngle = Math.acos((r1 * r1 + r2 * r2 - dSegmentLengthSquared) / (2 * r1 * r2));
            if (isNaN(dAngle)) {
                throw new Error("Should not happen");
            }

            angle -= dAngle;
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
    private readonly periodAngle: number;
    private readonly periodSurface: number;
    private readonly maxRadius: number;
    private parent: Gear | null = null;
    private rotation: number = 0;

    private constructor(
        private readonly center: ReadonlyPoint,
        private readonly periodRays: ReadonlyArray<Ray>,
        private readonly periodsCount: number) {
        let maxRadius = -10000000000;
        periodRays.forEach(ray => {
            ray.angle = normalizeAngle(ray.angle);
            maxRadius = Math.max(ray.radius, maxRadius);
        });
        this.maxRadius = maxRadius;

        this.periodAngle = TWO_PI / this.periodsCount;

        this.periodSurface = 0;
        for (const segment of this.iterateOnPeriodSegments()) {
            this.periodSurface += segment.deltaDistance;
        }

        const rays: Ray[] = [];
        for (let iP = 0; iP < periodsCount; iP++) {
            const periodStartingAngle = iP * this.periodAngle;
            periodRays.forEach(periodRay => {
                rays.push({
                    angle: normalizeAngle(periodStartingAngle + periodRay.angle),
                    radius: periodRay.radius,
                });
            });
        }
        this.rays = rays;
    }

    public setRotation(rotation: number): void {
        if (this.parent) {
            throw new Error("Cannot rotate child gear.");
        }
        this.setRotationInternal(rotation);
    }

    private setRotationInternal(rotation: number): void {
        this.rotation = makeAnglePositive(rotation);
    }

    public update(): void {
        if (!this.parent) {
            return; // nothing to do
        }

        const previousMasterAngle = this.parent.rotation;

        const relativeRotation = Math.atan2(this.center.y - this.parent.center.y, this.center.x - this.parent.center.x);
        this.parent.setRotationInternal(this.parent.rotation + relativeRotation);
        const surfaceRotation = this.parent.getCurrentRotatedSurface();
        this.rotateFromSurface(surfaceRotation);
        this.setRotationInternal(this.rotation - relativeRotation);

        this.parent.rotation = previousMasterAngle;
    }

    private getCurrentRotatedSurface(): number {
        const nbPeriods = Math.floor(this.rotation / this.periodAngle);
        let cumulatedAngle = this.periodAngle * nbPeriods;
        let cumulatedSurface = this.periodSurface * nbPeriods;

        for (const segment of this.iterateOnSegments()) {
            const nextCumulatedAngle = cumulatedAngle + segment.deltaAngle;
            const nextCumulatedSurface = cumulatedSurface + segment.deltaDistance;

            if (nextCumulatedAngle >= this.rotation) {
                let partial = 0;
                if (segment.deltaAngle > 0) {
                    partial = (nextCumulatedAngle - this.rotation) / segment.deltaAngle * segment.deltaDistance; // approximation
                }
                return cumulatedSurface + partial;
            }

            cumulatedAngle = nextCumulatedAngle
            cumulatedSurface = nextCumulatedSurface;
        }
        throw new Error();
    }

    private rotateFromSurface(targetSurface: number): void {
        const nbPeriods = Math.floor(targetSurface / this.periodSurface);
        this.rotation = -this.periodAngle * nbPeriods;
        let cumulatedSurface = this.periodSurface * nbPeriods;

        for (const segment of this.iterateOnSegments()) {
            const nextCumulatedSurface = cumulatedSurface + segment.deltaDistance;

            if (nextCumulatedSurface >= targetSurface) {
                if (segment.deltaDistance > 0) {
                    const partial = (nextCumulatedSurface - targetSurface) / segment.deltaDistance * segment.deltaAngle; // approximation
                    this.rotation -= partial;
                }
                return;
            }

            cumulatedSurface = nextCumulatedSurface;
            this.rotation -= segment.deltaAngle;
        }
    }

    private *iterateOnSegments(): Generator<Segment> {
        for (let iRay = 0; true; iRay++) {
            const currentRay = this.rays[iRay % this.rays.length]!;
            const nextRay = this.rays[(iRay + 1) % this.rays.length]!;

            const deltaAngle = computeDeltaAngle(nextRay, currentRay);
            const deltaDistance = computeDistance(nextRay, currentRay);

            yield {
                deltaAngle,
                deltaDistance,
                rayFrom: currentRay,
                rayTo: nextRay,
            };
        }
    }

    private *iterateOnPeriodSegments(): Generator<Segment> {
        for (let i = 0; i < this.periodRays.length; i++) {
            const currentRay = this.periodRays[i]!;
            let nextRay = this.periodRays[i + 1];
            if (!nextRay) {
                const firstPeriodRay = this.periodRays[0]!
                nextRay = {
                    angle: firstPeriodRay.angle + TWO_PI / this.periodsCount,
                    radius: firstPeriodRay.radius,
                };
            }

            const deltaAngle = computeDeltaAngle(nextRay, currentRay);
            const deltaDistance = computeDistance(nextRay, currentRay);

            yield {
                deltaAngle,
                deltaDistance,
                rayFrom: currentRay,
                rayTo: nextRay,
            };
        }
    }
}

export {
    Gear,
};

