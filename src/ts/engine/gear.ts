import { computeDeltaAngle, computeDistance, Ray } from "./rays";
import { normalizeAngle, TWO_PI } from "./angle-utils";
import { PolarCurve } from "./polar-curves";

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
    startingAngle: number;
    startingRadius: number;
    nextRadius: number;
    deltaAngle: number; // until next ray
    deltaDistance: number; // until next ray
};

type SvgRepresentation = {
    container: SVGElement;
    rotationElement: SVGElement;
};

class Gear {
    public static readonly centerRadius = 0.015;

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
                radius: distance - periodSegment.startingRadius,
            });

            const dSegmentLengthSquared = periodSegment.deltaDistance * periodSegment.deltaDistance;

            const r1 = distance - periodSegment.startingRadius;
            const r2 = distance - periodSegment.nextRadius;
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

    public readonly svgElement: SVGElement;
    private readonly svgRotationElement: SVGElement;
    private readonly periodSegments: Segment[];
    private readonly periodAngle: number;
    private readonly periodSurface: number;
    public readonly minRadius: number;
    public readonly maxRadius: number;
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
                startingAngle: currentRay.angle,
                startingRadius: currentRay.radius,
                nextRadius: nextRay.radius,
                deltaAngle,
                deltaDistance,
            };
        });

        this.periodSurface = 0;
        for (const segment of this.periodSegments) {
            this.periodSurface += segment.deltaDistance;
        }

        const svgRepresentation = this.buildSvgRepresentation();
        this.svgElement = svgRepresentation.container;
        this.svgRotationElement = svgRepresentation.rotationElement;
    }

    public rotate(rotation: number): void {
        if (this.parent) {
            throw new Error("Cannot rotate child gear.");
        }
        this.setRotationInternal(this.rotation + rotation);
        this.updateSvgRotation();
    }

    private setRotationInternal(rotation: number): void {
        this.rotation = normalizeAngle(rotation);
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

        this.updateSvgRotation();
    }

    private updateSvgRotation(): void {
        this.svgRotationElement.setAttribute("transform", `rotate(${180 / Math.PI * this.rotation})`);
    }

    private getCurrentRotatedSurface(): number {
        const nbPeriods = Math.floor(this.rotation / this.periodAngle);
        let cumulatedAngle = this.periodAngle * nbPeriods;
        let cumulatedSurface = this.periodSurface * nbPeriods;

        for (const segment of this.periodSegments) {
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

        for (const segment of this.periodSegments) {
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

    private *iterateOnRays(): Generator<Ray> {
        for (let iP = 0; iP < this.periodsCount; iP++) {
            const periodStartingAngle = this.orientation * iP * this.periodAngle;
            for (const periodSegment of this.periodSegments) {
                yield {
                    angle: normalizeAngle(periodStartingAngle + periodSegment.startingAngle),
                    radius: periodSegment.startingRadius,
                }
            }
        }
    }

    private buildSvgRepresentation(): SvgRepresentation {

        const containerElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
        containerElement.setAttribute("transform", `translate(${this.center.x},${this.center.y})`);

        const rotationElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
        containerElement.appendChild(rotationElement);

        // body
        {
            const pathParts = ["M"];
            for (const ray of this.iterateOnRays()) {
                const x = ray.radius * Math.cos(ray.angle);
                const y = ray.radius * Math.sin(ray.angle);
                pathParts.push(`${x} ${y}`);
            }
            pathParts.push("Z");

            const color = this.parent ? "red" : "#FF6A00";
            const gearElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
            gearElement.setAttribute("d", pathParts.join(" "));
            gearElement.setAttribute("fill", color);
            gearElement.setAttribute("fill-opacity", "0.3");
            gearElement.setAttribute("stroke", color);
            gearElement.setAttribute("stroke-width", "0.006");
            rotationElement.appendChild(gearElement);
        }

        const centerColor = "green";

        // rays
        {
            const firstPeriodSegment = this.periodSegments[0];
            if (!firstPeriodSegment) {
                throw new Error("Gear has no rays.");
            }
            const length = Math.min(firstPeriodSegment.startingRadius, 0.05);

            const pathParts: string[] = [];
            for (let i = 0; i < this.periodsCount; i++) {
                pathParts.push("M0 0");

                const angle = firstPeriodSegment.startingAngle + i * this.periodAngle;
                const x = length * Math.cos(angle);
                const y = length * Math.sin(angle);
                pathParts.push(`L${x} ${y}`);
            }
            const raysElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
            raysElement.setAttribute("d", pathParts.join(""));
            raysElement.setAttribute("stroke", centerColor);
            raysElement.setAttribute("stroke-width", "0.006");
            rotationElement.appendChild(raysElement);
        }

        // center
        {
            const centerElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            centerElement.setAttribute("cx", "0");
            centerElement.setAttribute("cy", "0");
            centerElement.setAttribute("r", Gear.centerRadius.toString());
            centerElement.setAttribute("fill", centerColor);
            containerElement.appendChild(centerElement);
        }

        return {
            container: containerElement,
            rotationElement,
        };
    }
}

export {
    Gear,
};

