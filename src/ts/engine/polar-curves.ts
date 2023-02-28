import { TWO_PI } from "./angle-utils";
import { Ray } from "./rays";

type PolarCurve = {
    periodRays: Ray[];
    periodsCount: number;
};

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

export type {
    PolarCurve,
};
export {
    buildCircle,
    buildEllipse,
};

