/// <reference types="./page-interface-generated" />

const controlId = {
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
};

abstract class Parameters {
    public static get rotationSpeed(): number {
        return Page.Range.getValue(controlId.ROTATION_SPEED_RANGE);
    }
}

export {
    Parameters,
};

