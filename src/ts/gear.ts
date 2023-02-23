import { Point } from "./point";

type Ray = {
    radius: number;
    angle: number;
};

type TryResult = {
    distance: number;
    periodicity: number;
    error: number;
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
            context.fillStyle = "rgba(255,0,0,0.1)";
            context.strokeStyle = "red";

            for (const gear of gears) {
                context.beginPath();
                gear.rays.forEach((part: Ray, index: number) => {
                    const point = {
                        x: gear.center.x + part.radius * Math.cos(part.angle + gear.rotation),
                        y: gear.center.y + part.radius * Math.sin(part.angle + gear.rotation),
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

                const part = gear.rays[0];
                if (!part) {
                    throw new Error("Gear has no parts.");
                }
                const point = {
                    x: gear.center.x + part.radius * Math.cos(part.angle + gear.rotation),
                    y: gear.center.y + part.radius * Math.sin(part.angle + gear.rotation),
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
                context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                context.closePath();
                context.fill();
            }
        }
    }

    public periodicity: number = 1;
    public rotation: number = 0;
    private readonly center: Point;

    private readonly rays: Ray[] = [];

    public constructor() {
        this.center = { x: 0, y: 0 };

        const step = 2 * Math.PI / 360;

        const a = 0.3;
        const b = 0.15;

        for (let i = 0; i < 2 * Math.PI; i += step) {
            this.rays.push({
                radius: a * b / Math.sqrt(Math.pow(b * Math.cos(i), 2) + Math.pow(a * Math.sin(i), 2)),
                angle: i,
            });
        }
    }

    public change(center: Point, other: Gear): void {
        const dX = center.x - other.center.x;
        const dY = center.y - other.center.y;
        const idealDistance = Math.sqrt(dX * dX + dY * dY);

        const initialTry = this.tryChange(idealDistance, other);

        let tooLowTry = initialTry;
        let tooHighTry = null as TryResult | null;

        const maxTries = 200;
        let triesCount = 1;
        while (tooLowTry.error > 0.0001 && triesCount < maxTries) {
            const currentDistance = tooHighTry ? 0.5 * (tooLowTry.distance + tooHighTry.distance) : tooLowTry.distance + 1;
            if (currentDistance === tooLowTry.distance || currentDistance === tooHighTry?.distance) {
                // console.log("Convergence");
                break;
            }

            const currentTry = this.tryChange(currentDistance, other);
            // let gap = tooHighTry ? tooHighTry?.distance - tooLowTry.distance : null;
            // console.log(`distance: ${currentTry.distance}\t\t\terror ${currentTry.error}\t\tgap ${gap}\t\ttoo low ${JSON.stringify(tooLowTry)}\t\ttoo high ${JSON.stringify(tooHighTry)}`);
            if (currentTry.periodicity > tooLowTry.periodicity || currentTry.error > tooLowTry.error) {
                tooHighTry = currentTry;
            } else {
                tooLowTry = currentTry;
            }
            triesCount++;
        }

        const finalTry = tooLowTry;
        console.log(`Final error ${finalTry.error} obtained in ${triesCount} tries. Final periodicity ${finalTry.periodicity}, initial was ${initialTry.periodicity}.`);

        this.center.x = finalTry.distance;
        this.center.y = 0;
        this.periodicity = finalTry.periodicity;
        // this.rotation = Math.atan2(dY, dX);
        // this.center.x = finalTry.distance * Math.cos(this.rotation);
        // this.center.y = finalTry.distance * Math.sin(this.rotation);
    }

    /* Returns matching score */
    private tryChange(distance: number, other: Gear): TryResult {
        this.rays.length = 0;

        const otherFirstRay = other.rays[0];
        if (!otherFirstRay) {
            throw new Error("No ray :(");
        }

        const initialAngle = Math.PI - otherFirstRay.angle;
        let angle = initialAngle;
        this.rays.push({
            radius: distance - otherFirstRay.radius,
            angle,
        });

        let periodicity = 1;
        let i = 0;
        while (1) {
            const otherRay1 = other.rays[i % other.rays.length]!;
            const otherRay2 = other.rays[(i + 1) % other.rays.length]!;

            const otherR1 = otherRay1.radius;
            const otherR2 = otherRay2.radius;
            const dOtherAngle = otherRay2.angle - otherRay1.angle;
            const dSegmentLengthSquared = (otherR1 * otherR1) + (otherR2 * otherR2) - 2 * otherR1 * otherR2 * Math.cos(dOtherAngle);

            const r1 = distance - otherR1;
            const r2 = distance - otherR2;
            const dAngle = Math.acos((r1 * r1 + r2 * r2 - dSegmentLengthSquared) / (2 * r1 * r2));
            if (isNaN(dAngle)) {
                throw new Error(":(");
            }

            angle -= dAngle;
            if (Math.abs(angle - initialAngle) >= 2 * Math.PI) {
                break;
            }
            this.rays.push({
                radius: r2,
                angle,
            });

            i++;

            if (i >= other.rays.length) {
                periodicity++;
                i %= other.rays.length;
            }
        }

        return {
            distance,
            periodicity,
            error: other.rays.length - i,
        };
    }
}

export {
    Gear,
};

