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

export {
    makeAnglePositive,
    normalizeAngle,
    toDegrees,
    TWO_PI,
};

