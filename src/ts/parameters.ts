/// <reference types="./page-interface-generated" />

const controlId = {
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
    CENTRAL_GEAR_SELECT_ID: "central-gear-select-id",
    RESET_BUTTON_ID: "reset-button",
    RANDOM_BUTTON_ID: "random-button",
};

enum EGearShape {
    ELLIPSE = "ellipse",
    OFF_CIRCLE = "off-circle",
    HEART = "heart",
    TRIANGLE = "triangle",
    OFF_TRIANGLE = "off-triangle",
    SQUARE = "square",
    OFF_SQUARE = "off-square",
    PENTAGON = "pentagon",
    OFF_PENTAGON = "off-pentagon",
    CIRCLE = "circle",
    RANDOM = "random",
}

function callCallbacks(callbacks: VoidFunction[]): void {
    for (const callback of callbacks) {
        callback();
    }
}

Page.Select.addObserver(controlId.CENTRAL_GEAR_SELECT_ID, () => {
    callCallbacks(Parameters.onGearShapeChange);
});

Page.Button.addObserver(controlId.RESET_BUTTON_ID, () => {
    callCallbacks(Parameters.onReset);
});

Page.Button.addObserver(controlId.RANDOM_BUTTON_ID, () => {
    const gearShapes = Object.values(EGearShape);
    const shapeId = Math.floor(Math.random() * gearShapes.length);
    const gearShape = gearShapes[shapeId] as string;
    Page.Select.setValue(controlId.CENTRAL_GEAR_SELECT_ID, gearShape);
    callCallbacks(Parameters.onReset);
});

abstract class Parameters {
    public static get rotationSpeed(): number {
        return Page.Range.getValue(controlId.ROTATION_SPEED_RANGE);
    }

    public static get gearShape(): EGearShape {
        return Page.Select.getValue(controlId.CENTRAL_GEAR_SELECT_ID) as EGearShape;
    }

    public static onGearShapeChange: VoidFunction[] = [];

    public static onReset: VoidFunction[] = [];
}

export {
    EGearShape,
    Parameters,
};

