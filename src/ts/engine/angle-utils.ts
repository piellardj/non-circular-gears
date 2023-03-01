const TWO_PI = 2 * Math.PI;

function makeAnglePositive(angle: number): number {
    if (angle < 0) {
        angle += TWO_PI * Math.ceil(-angle / TWO_PI);
    }
    return angle;
}
function normalizeAngle(angle: number): number {
    angle = makeAnglePositive(angle);
    return angle % TWO_PI;
}

function toDegrees(angleInRadians: number): number {
    return 180 / Math.PI * angleInRadians;
}

function toRadians(angleInDegrees: number): number {
    return Math.PI / 180 * angleInDegrees;
}

function angleDifference(angle1: number, angle2: number): number {
    const rawDifference = normalizeAngle(angle2 - angle1);
    if (rawDifference <= Math.PI) {
        return rawDifference;
    }
    return TWO_PI - rawDifference;
}

export {
    angleDifference,
    makeAnglePositive,
    normalizeAngle,
    toDegrees,
    toRadians,
    TWO_PI,
};

