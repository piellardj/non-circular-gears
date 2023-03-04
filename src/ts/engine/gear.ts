import { normalizeAngle, toDegrees, TWO_PI } from "./angle-utils";
import type { Point, Vector } from "./point";
import type { PolarCurve } from "./polar-curves";
import { computeDeltaAngle, computeDistance, computeNormal, type Ray, type ReadonlyRay } from "./rays";

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
    readonly startingRay: ReadonlyRay;
    readonly nextRay: ReadonlyRay;
    readonly deltaAngle: number; // between starting and next rays
    readonly deltaDistance: number; // between starting and next rays
};

type SurfaceFragment = {
    point: Point;
    normal: Vector;
};

enum ESurfaceType {
    NONE,
    SMOOTH,
    TEETH,
}

type SvgRepresentation = {
    readonly container: SVGElement;
    readonly rotationElement: SVGElement;
    readonly gearElement: SVGElement;
    surfaceType: ESurfaceType;
    computedSmoothPath: string | null;
    computedTeethPath: string | null;
};

const svgStyleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
svgStyleElement.innerHTML = `.gear {
    fill: red;
    fill-opacity: 0.3;
    stroke: red;
    stroke-width: 0.006;
}
.gear.main {
    fill: #FF6A00;
    stroke: #FF6A00;
}
.gear-rays {
    stroke: green;
    stroke-width: 0.006;
}
.gear-axis {
    fill: green;
}`;
class Gear {
    public static readonly centerRadius = 0.015;
    public static readonly svgStyleElement = svgStyleElement;

    public static create(center: ReadonlyPoint, polarCurve: PolarCurve): Gear {
        return new Gear(center, polarCurve.periodRays, polarCurve.periodsCount, +1);
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
        const newGear = new Gear(center, period.periodRays, period.targetPeriod, -master.orientation, master);

        return newGear;
    }

    private static tryBuildCompanionPeriod(distance: number, master: Gear): ConstructionResult {
        const periodRays: Ray[] = [];
        let angle = 0;

        for (const periodSegment of master.periodSegments) {
            periodRays.push({
                angle,
                radius: distance - periodSegment.startingRay.radius,
            });

            const dSegmentLengthSquared = periodSegment.deltaDistance * periodSegment.deltaDistance;

            const r1 = distance - periodSegment.startingRay.radius;
            const r2 = distance - periodSegment.nextRay.radius;
            const dAngle = Math.acos((r1 * r1 + r2 * r2 - dSegmentLengthSquared) / (2 * r1 * r2));
            if (isNaN(dAngle)) {
                throw new Error("Should not happen");
            }

            angle += dAngle;
        }

        if (master.orientation > 0) {
            for (const periodRay of periodRays) {
                periodRay.angle = Math.PI - periodRay.angle;
            }
        }

        const period = TWO_PI / angle;
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
                // console.debug("Convergence");
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
        // console.debug(`Final error ${finalTry.error} obtained in ${triesCount} tries. Final periodicity ${finalTry.targetPeriod}, initial was ${initialTry.targetPeriod}.`);
        return finalTry.distance;
    }

    private readonly svgRepresentation: SvgRepresentation;
    public get svgElement(): SVGElement {
        return this.svgRepresentation.container;
    }

    private readonly periodSegments: ReadonlyArray<Segment>;
    private readonly periodSegmentsReverse: ReadonlyArray<Segment>;
    private readonly periodAngle: number;
    private readonly periodSurface: number;
    public readonly minRadius: number;
    public readonly maxRadius: number;
    private readonly toothSize: number;
    private rotation: number = 0;

    private constructor(
        public readonly center: ReadonlyPoint,
        periodRays: ReadonlyArray<Ray>,
        private readonly periodsCount: number,
        private readonly orientation: number,
        private readonly parent?: Gear) {
        let minRadius = 10000000000;
        let maxRadius = -10000000000;
        periodRays.forEach(ray => {
            ray.angle = normalizeAngle(ray.angle);
            minRadius = Math.min(ray.radius, minRadius);
            maxRadius = Math.max(ray.radius, maxRadius);
        });
        this.minRadius = minRadius;
        this.maxRadius = maxRadius;

        this.periodAngle = TWO_PI / this.periodsCount;

        const firstPeriodRay = periodRays[0];
        if (!firstPeriodRay) {
            throw new Error();
        }
        this.periodSegments = periodRays.map((currentRay: Ray, index: number) => {
            let nextRay = periodRays[index + 1];
            if (!nextRay) {
                nextRay = {
                    angle: firstPeriodRay.angle + this.orientation * this.periodAngle,
                    radius: firstPeriodRay.radius,
                };
            }

            const deltaAngle = computeDeltaAngle(nextRay, currentRay);
            const deltaDistance = computeDistance(nextRay, currentRay);

            return {
                startingRay: { angle: currentRay.angle, radius: currentRay.radius },
                nextRay,
                deltaAngle,
                deltaDistance,
            };
        });
        this.periodSegmentsReverse = this.periodSegments.slice().reverse();

        this.periodSurface = 0;
        for (const segment of this.periodSegments) {
            this.periodSurface += segment.deltaDistance;
        }

        const idealToothSize = 0.02;
        const teethCount = Math.ceil(this.periodSurface / idealToothSize);
        this.toothSize = this.periodSurface / teethCount;

        this.svgRepresentation = this.buildSvgRepresentation();
    }

    public rotate(rotation: number): void {
        if (this.parent) {
            throw new Error("Cannot rotate child gear.");
        }
        this.setRotationInternal(this.rotation + rotation);
    }

    public update(): void {
        if (!this.parent) {
            return; // nothing to do
        }

        const previousMasterAngle = this.parent.rotation;
        {
            let relativeRotation = Math.atan2(this.center.y - this.parent.center.y, this.center.x - this.parent.center.x);
            if (this.orientation > 0) {
                relativeRotation = Math.PI + relativeRotation;
            }
            this.parent.setRotationInternal(this.parent.rotation - relativeRotation);
            const surfaceRotation = this.parent.getCurrentRotatedSurface();
            this.rotateFromSurface(surfaceRotation);
            this.setRotationInternal(this.rotation + relativeRotation);
        }
        this.parent.rotation = previousMasterAngle;
    }

    public updateDisplay(showTeeth: boolean): void {
        this.svgRepresentation.rotationElement.setAttribute("transform", `rotate(${toDegrees(this.rotation)})`);

        if (showTeeth && this.svgRepresentation.surfaceType !== ESurfaceType.TEETH) {
            if (!this.svgRepresentation.computedTeethPath) {
                const periodPoints = this.buildPeriodPointsWithTeeth();
                this.svgRepresentation.computedTeethPath = this.buildSvgPath(periodPoints);
            }
            this.svgRepresentation.gearElement.setAttribute("d", this.svgRepresentation.computedTeethPath);
            this.svgRepresentation.surfaceType = ESurfaceType.TEETH;
        } else if (!showTeeth && this.svgRepresentation.surfaceType !== ESurfaceType.SMOOTH) {
            if (!this.svgRepresentation.computedSmoothPath) {
                const periodPoints = this.buildPeriodPointsSmooth();
                this.svgRepresentation.computedSmoothPath = this.buildSvgPath(periodPoints);
            }
            this.svgRepresentation.gearElement.setAttribute("d", this.svgRepresentation.computedSmoothPath);
            this.svgRepresentation.surfaceType = ESurfaceType.SMOOTH;
        }
    }

    private setRotationInternal(rotation: number): void {
        this.rotation = normalizeAngle(rotation);
    }

    private getCurrentRotatedSurface(): number {
        const nbPeriods = Math.floor(this.rotation / this.periodAngle);
        let cumulatedAngle = this.periodAngle * nbPeriods;
        let cumulatedSurface = this.periodSurface * nbPeriods;

        const periodSegments = (this.orientation > 0) ? this.periodSegmentsReverse : this.periodSegments;
        for (const segment of periodSegments) {
            const nextCumulatedAngle = cumulatedAngle + segment.deltaAngle;
            const nextCumulatedSurface = cumulatedSurface + segment.deltaDistance;

            if (nextCumulatedAngle >= this.rotation) {
                let partial = 0;
                if (segment.deltaAngle > 0) {
                    partial = (nextCumulatedAngle - this.rotation) / segment.deltaAngle * segment.deltaDistance; // approximation
                }
                return cumulatedSurface + partial;
            }

            cumulatedAngle = nextCumulatedAngle;
            cumulatedSurface = nextCumulatedSurface;
        }
        throw new Error();
    }

    private rotateFromSurface(targetSurface: number): void {
        const nbPeriods = Math.floor(targetSurface / this.periodSurface);
        this.rotation = -this.periodAngle * nbPeriods;
        let cumulatedSurface = this.periodSurface * nbPeriods;

        const periodSegments = (this.orientation < 0) ? this.periodSegmentsReverse : this.periodSegments;
        for (const segment of periodSegments) {
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

        throw new Error();
    }

    private *walkOnPeriod(stepSize: number): Generator<SurfaceFragment> {
        let positionOnSegment = 0;
        for (const periodSegment of this.periodSegments) {
            const normal = computeNormal(periodSegment.startingRay, periodSegment.nextRay);

            while (positionOnSegment < periodSegment.deltaDistance) {
                const x = positionOnSegment / periodSegment.deltaDistance; // relative advancement

                const angle = periodSegment.startingRay.angle + this.orientation * x * periodSegment.deltaAngle;
                const radius = periodSegment.startingRay.radius + x * (periodSegment.nextRay.radius - periodSegment.startingRay.radius);
                const point = {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                };
                yield { point, normal };
                positionOnSegment += stepSize;
            }

            positionOnSegment -= periodSegment.deltaDistance;
        }
    }

    private buildPeriodPointsSmooth(): Point[] {
        const points = this.periodSegments.map(segment => {
            return {
                x: segment.startingRay.radius * Math.cos(segment.startingRay.angle),
                y: segment.startingRay.radius * Math.sin(segment.startingRay.angle),
            };
        });
        return points;
    }

    private buildPeriodPointsWithTeeth(): Point[] {
        const points: Point[] = [];
        const stepSize = this.toothSize / 10;
        let i = 0;
        for (const surfaceFragment of this.walkOnPeriod(stepSize)) {
            const cos = Math.cos(i * TWO_PI / this.toothSize - Math.PI / 2);
            const teethOffset = 0.0025 * this.orientation * Math.sign(cos) * Math.pow(Math.abs(cos), 1 / 5);

            points.push({
                x: surfaceFragment.point.x + teethOffset * surfaceFragment.normal.x,
                y: surfaceFragment.point.y + teethOffset * surfaceFragment.normal.y,
            });
            i += stepSize;
        }
        return points;
    }

    private buildSvgPath(pointsForPeriod: Point[]): string {
        const pathParts = ["M"];

        for (let iP = 0; iP < this.periodsCount; iP++) {
            const periodStartingAngle = this.orientation * iP * this.periodAngle;
            const cos = Math.cos(periodStartingAngle);
            const sin = Math.sin(periodStartingAngle);

            for (const point of pointsForPeriod) {
                const x = cos * point.x - sin * point.y;
                const y = sin * point.x + cos * point.y;
                pathParts.push(`${x} ${y}`);
            }
        }

        pathParts.push("Z");
        return pathParts.join(" ");
    }

    private buildSvgRepresentation(): SvgRepresentation {
        const containerElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
        containerElement.setAttribute("transform", `translate(${this.center.x},${this.center.y})`);

        const rotationElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
        containerElement.appendChild(rotationElement);

        const gearElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gearElement.setAttribute("class", this.parent ? "gear" : "gear main");
        rotationElement.appendChild(gearElement);

        const firstPeriodSegment = this.periodSegments[0];
        if (!firstPeriodSegment) {
            throw new Error("Gear has no rays.");
        }

        // rays
        {
            const length = Math.min(firstPeriodSegment.startingRay.radius, 0.05);

            const pathParts: string[] = [];
            for (let i = 0; i < this.periodsCount; i++) {
                pathParts.push("M0 0");

                const angle = firstPeriodSegment.startingRay.angle + i * this.periodAngle;
                const x = length * Math.cos(angle);
                const y = length * Math.sin(angle);
                pathParts.push(`L${x} ${y}`);
            }
            const raysElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
            raysElement.setAttribute("d", pathParts.join(""));
            raysElement.setAttribute("class", "gear-rays");
            rotationElement.appendChild(raysElement);
        }

        // center
        {
            let centerElement: SVGElement;
            if (this.periodsCount < 3) {
                centerElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                centerElement.setAttribute("cx", "0");
                centerElement.setAttribute("cy", "0");
                centerElement.setAttribute("r", Gear.centerRadius.toString());
            } else {
                const radius = Gear.centerRadius * (1 + 0.1 * Math.max(0, 5 - this.periodsCount + 3));
                const pathParts: string[] = [];
                for (let i = 0; i < this.periodsCount; i++) {
                    const command = (i === 0) ? "M" : "L";
                    const angle = firstPeriodSegment.startingRay.angle + i * this.periodAngle;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    pathParts.push(`${command}${x} ${y}`);
                }
                pathParts.push("Z");
                centerElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                centerElement.setAttribute("d", pathParts.join(""));
            }
            centerElement.setAttribute("class", "gear-axis");
            rotationElement.appendChild(centerElement);
        }

        return {
            container: containerElement,
            rotationElement,
            gearElement,
            surfaceType: ESurfaceType.NONE,
            computedSmoothPath: null,
            computedTeethPath: null,
        };
    }
}

export {
    Gear,
};

