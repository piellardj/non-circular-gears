import { normalizeAngle, TWO_PI } from "./angle-utils";
import { Point } from "./point";
import { Ray } from "./rays";

type PolarCurve = {
    periodRays: Ray[];
    periodsCount: number;
};


function getRadiusesForCircle(center: Point, radius: number, angle: number): number[] {
    const result: number[] = [];

    const a = -2 * (center.x * Math.cos(angle) + center.y * Math.sin(angle));
    const b = center.x * center.x + center.y * center.y - radius * radius;

    const det = a * a - 4 * b;
    if (det >= 0) {
        const sqrtDet = Math.sqrt(det);
        result.push(0.5 * (sqrtDet - a));
        result.push(0.5 * (-sqrtDet - a));
    }
    return result;
}

// ax +by = c
function getRadiusForLine(a: number, b: number, c: number, angle: number): number {
    const det = a * Math.cos(angle) + b * Math.sin(angle);
    if (det === 0) {
        throw new Error();
    }
    return c / det;
}

function buildEllipse(a: number, b: number): PolarCurve {
    const periodsCount = 2;
    const periodStepsCount = 30;
    const periodRays: Ray[] = [];
    for (let i = 0; i < periodStepsCount; i++) {
        const percentage = i / periodStepsCount;
        const angle = Math.PI * percentage;
        periodRays.push({
            angle,
            radius: a * b / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2)),
        });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildCircle(radius: number): PolarCurve {
    const periodsCount = 60;
    const raysCount = 2 * periodsCount;

    const periodRays: Ray[] = [];
    for (let i = 0; i < 2; i++) {
        const percentage = i / raysCount;
        const angle = TWO_PI * percentage;
        periodRays.push({
            angle,
            radius,
        });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildOffCircle(radius: number, centerOffset: number): PolarCurve {
    const center = { x: centerOffset, y: 0 };

    const periodsCount = 1;
    const raysCount = 90;

    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const percentage = i / raysCount;
        const angle = TWO_PI * percentage;

        const radiuses = getRadiusesForCircle(center, radius, angle);
        if (radiuses.length !== 2) {
            throw new Error();
        }
        periodRays.push({
            angle,
            radius: Math.max(radiuses[0]!, radiuses[1]!),
        });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildHeart(size: number): PolarCurve {
    const periodsCount = 1;
    const raysCount = 90;

    const rotation = Math.PI / 2;
    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const percentage = i / raysCount;
        const angle = normalizeAngle(TWO_PI * percentage + rotation);

        let radius: number;
        if (angle < Math.PI) {
            const x = 3.3030615433;
            const y = 2.6969384567;
            const circleRadius = Math.sqrt(14.5469540784);

            let radiuses: number[];
            if (angle < Math.PI / 2) {
                radiuses = getRadiusesForCircle({ x, y }, circleRadius, angle);
            } else {
                radiuses = getRadiusesForCircle({ x: -x, y }, circleRadius, angle);
            }
            radius = Math.max(radiuses[0]!, radiuses[1]!);
        } else {
            if (angle < 3 * Math.PI / 2) {
                radius = getRadiusForLine(1, 1, -6, angle);
            } else {
                radius = getRadiusForLine(-1, 1, -6, angle);
            }
        }

        periodRays.push({
            angle: normalizeAngle(angle - rotation),
            radius: radius * size,
        });
    }

    return {
        periodRays,
        periodsCount,
    };
}

export type {
    PolarCurve,
};
export {
    buildCircle,
    buildEllipse,
    buildHeart,
    buildOffCircle,
};

