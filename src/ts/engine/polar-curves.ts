import { angleDifference, normalizeAngle, toRadians, TWO_PI } from "./angle-utils";
import { Point } from "./point";
import { Ray } from "./rays";

declare const vnoise: {
    seed: number,
    fractal2d: (x: number, y: number, octave: number) => number; // returns something in [-2,+2]
}; // from js-value-noise

type PolarCurve = {
    periodRays: Ray[];
    periodsCount: number;
};

// ax +by = c
type LineEquation = {
    a: number;
    b: number;
    c: number;
};

type CircleEquation = {
    center: Point;
    radius: number;
};

enum ERadiusChoice {
    NEAREST,
    FURTHEST,
}

function getRadiusForCircle(circleEquation: CircleEquation, angle: number, choice: ERadiusChoice): number {
    const a = -2 * (circleEquation.center.x * Math.cos(angle) + circleEquation.center.y * Math.sin(angle));
    const b = circleEquation.center.x * circleEquation.center.x + circleEquation.center.y * circleEquation.center.y - circleEquation.radius * circleEquation.radius;

    const det = a * a - 4 * b;
    if (det >= 0) {
        const sqrtDet = Math.sqrt(det);
        if (choice === ERadiusChoice.NEAREST) {
            return 0.5 * (-sqrtDet - a);
        } else {
            return 0.5 * (sqrtDet - a);
        }

    }
    return NaN;
}

function getLineEquation(p1: Point, p2: Point): LineEquation {
    const a = (p1.y - p2.y) / (p2.x - p1.x);
    const b = 1;
    const c = p1.y + a * p1.x;
    return { a, b, c };
}

function getRadiusForLine(line: LineEquation, angle: number): number {
    const det = line.a * Math.cos(angle) + line.b * Math.sin(angle);
    if (det === 0) {
        return NaN;
    }
    return line.c / det;
}

function buildEllipse(a: number, b: number): PolarCurve {
    const periodsCount = 2;
    const periodStepsCount = 60;
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
    const periodsCount = 3;
    const periodSize = 40;

    const periodRays: Ray[] = [];
    for (let i = 0; i < periodSize; i++) {
        const percentage = i / periodSize;
        const angle = TWO_PI / periodsCount * percentage;
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
    const circleEquation = { center, radius };

    const periodsCount = 1;
    const raysCount = 120;

    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const percentage = i / raysCount;
        const angle = TWO_PI * percentage;

        const radius = getRadiusForCircle(circleEquation, angle, ERadiusChoice.FURTHEST);
        if (isNaN(radius)) {
            throw new Error();
        }
        periodRays.push({ angle, radius });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildHeart(size: number): PolarCurve {
    const periodsCount = 1;
    const raysCount = 90;

    const lineEquations: LineEquation[] = [];
    lineEquations.push({ a: 1, b: 1, c: -1 });
    lineEquations.push({ a: -1, b: 1, c: 1 });
    lineEquations.push({ a: 1, b: 0, c: 5 });

    const bottomCircleRadius = 0.2;
    const bottomCircleEquation: CircleEquation = {
        center: { x: -1 + bottomCircleRadius * Math.SQRT2, y: 0 },
        radius: bottomCircleRadius,
    };

    const lobesRadius = 0.6;
    const lobesX = lobesRadius * Math.SQRT2 - 0.45;
    const lobesY = 0.95 * lobesRadius;
    const lobesSidesX = lobesX - lobesRadius * Math.SQRT2 + 0.4;
    const lobeCirclesEquations: CircleEquation[] = [
        { center: { x: lobesX, y: lobesY }, radius: lobesRadius },
        { center: { x: lobesX, y: -lobesY }, radius: lobesRadius },
    ];

    const lobesCentralEquation: CircleEquation = {
        center: { x: 1, y: 0 },
        radius: 0.2,
    };

    const rotation = 0;//3 * Math.PI / 4;
    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const percentage = i / raysCount;
        const angle = normalizeAngle(TWO_PI * percentage);

        let radius = 1000000;
        for (const lineEquation of lineEquations) {
            const localRadius = getRadiusForLine(lineEquation, angle);
            if (!isNaN(localRadius) && localRadius > 0) {
                radius = Math.min(localRadius, radius);
            }
        }

        {
            const localRadius = getRadiusForCircle(bottomCircleEquation, angle, ERadiusChoice.FURTHEST);
            if (!isNaN(localRadius) && localRadius > 0) {
                const pointX = localRadius * Math.cos(angle);
                if (pointX < 0.5 * (bottomCircleEquation.center.x - 1)) {
                    radius = Math.min(localRadius, radius);
                }
            }
        }

        {
            for (const lobeCircleEquation of lobeCirclesEquations) {
                const localRadius = getRadiusForCircle(lobeCircleEquation, angle, ERadiusChoice.FURTHEST);
                if (!isNaN(localRadius) && localRadius > 0) {
                    const point = { x: localRadius * Math.cos(angle), y: localRadius * Math.sin(angle) };
                    if (point.y * lobeCircleEquation.center.y >= 0 && point.x > lobesSidesX) {
                        radius = Math.min(localRadius, radius);
                    }
                }
            }
        }

        {
            const localRadius = getRadiusForCircle(lobesCentralEquation, angle, ERadiusChoice.NEAREST);
            if (!isNaN(localRadius) && localRadius > 0) {
                const pointX = localRadius * Math.cos(angle);
                if (pointX < 1) {
                    radius = Math.max(localRadius, radius);
                }
            }
        }

        periodRays.push({
            angle: normalizeAngle(angle - rotation),
            radius: radius * size * 7,
        });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildPolygon(size: number, sides: number): PolarCurve {
    const periodsCount = sides;
    const raysCount = 40;

    const periodAngle = TWO_PI / sides;
    const p1 = { x: 1, y: 0 };
    const p2 = { x: Math.cos(periodAngle), y: Math.sin(periodAngle) };
    const lineEquation = getLineEquation(p1, p2);

    const interiorAngle = toRadians(180 * (sides - 2) / sides);
    const circlesRadius = 0.2;
    const circleDistance = 1 - circlesRadius / Math.sin(interiorAngle / 2);

    const circles: CircleEquation[] = [{
        center: { x: circleDistance, y: 0 },
        radius: circlesRadius
    }, {
        center: { x: circleDistance * Math.cos(periodAngle), y: circleDistance * Math.sin(periodAngle) },
        radius: circlesRadius
    }];

    const isCircleRadiusValid = (circleEquation: CircleEquation, angle: number, radius: number): boolean => {
        const intersection = { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
        const circleAngle = Math.atan2(circleEquation.center.y, circleEquation.center.x);
        const localAngle = Math.atan2(intersection.y - circleEquation.center.y, intersection.x - circleEquation.center.x);
        return angleDifference(circleAngle, localAngle) < Math.PI - Math.PI / 2 - 0.5 * interiorAngle;
    };

    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const angle = i / raysCount * periodAngle;

        let radius = getRadiusForLine(lineEquation, angle);
        for (const circle of circles) {
            const circleRadius = getRadiusForCircle(circle, angle, ERadiusChoice.FURTHEST);
            if (!isNaN(circleRadius)) {
                if (isCircleRadiusValid(circle, angle, circleRadius)) {
                    radius = Math.min(circleRadius, circleRadius);
                }
            }
        }
        periodRays.push({ angle, radius: size * radius });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildOffPolygon(size: number, sides: number, offset: number): PolarCurve {
    const periodsCount = 1;
    const raysCount = 90;

    const interiorAngle = toRadians(180 * (sides - 2) / sides);
    const circlesRadius = 0.2;
    const circleDistance = 1 - circlesRadius / Math.sin(interiorAngle / 2);
    const circles: CircleEquation[] = [];

    const periodAngle = TWO_PI / sides;
    const center = { x: offset, y: 0 };
    const points: Point[] = [];
    for (let i = 0; i < sides; i++) {
        const angle = i * periodAngle;
        points.push({
            x: Math.cos(angle) - center.x,
            y: Math.sin(angle) - center.y,
        });

        circles.push({
            center: { x: -center.x + circleDistance * Math.cos(angle), y: -center.y + circleDistance * Math.sin(angle) },
            radius: circlesRadius,
        });
    }

    const isCircleRadiusValid = (circleEquation: CircleEquation, angle: number, radius: number): boolean => {
        const intersection = { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
        const realCenter = { x: circleEquation.center.x + center.x, y: circleEquation.center.y + center.y };
        const circleAngle = Math.atan2(realCenter.y, realCenter.x);
        const localAngle = Math.atan2(intersection.y - realCenter.y, intersection.x - realCenter.x);
        return angleDifference(circleAngle, localAngle) < Math.PI - Math.PI / 2 - 0.5 * interiorAngle;
    };

    const lineEquations = points.map((point: Point, index: number) => {
        const p1 = point;
        const p2 = points[(index + 1) % points.length]!;
        return getLineEquation(p1, p2);
    });

    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const angle = i / raysCount * TWO_PI;

        let minRadius = 100000;
        for (const lineEquation of lineEquations) {
            const radius = getRadiusForLine(lineEquation, angle);
            if (radius > 0 && radius < minRadius) {
                minRadius = radius;
            }
        }

        for (const circle of circles) {
            const circleRadius = getRadiusForCircle(circle, angle, ERadiusChoice.FURTHEST);
            if (!isNaN(circleRadius)) {
                if (circleRadius > 0 && isCircleRadiusValid(circle, angle, circleRadius)) {
                    minRadius = Math.min(circleRadius, circleRadius);
                }
            }
        }

        periodRays.push({ angle, radius: size * minRadius });
    }

    return {
        periodRays,
        periodsCount,
    };
}

function buildRandom(size: number): PolarCurve {
    const periodsCount = 1;
    const raysCount = 90;

    const range = size * 1.5;

    vnoise.seed = Math.random();

    const periodRays: Ray[] = [];
    for (let i = 0; i < raysCount; i++) {
        const angle = TWO_PI * i / raysCount;
        const noise = vnoise.fractal2d(Math.cos(angle), Math.sin(angle), 2) * 0.25; // in [-0.5,+0.5]
        periodRays.push({
            angle,
            radius: size + range * noise,
        });
    }
    vnoise
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
    buildOffPolygon,
    buildPolygon,
    buildRandom,
};

