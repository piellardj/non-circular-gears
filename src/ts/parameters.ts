/// <reference types="./page-interface-generated" />

const controlId = {
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
    CENTRAL_GEAR_TABS_ID: "central-gear-tabs-id",
    RESET_BUTTON_ID: "reset-button",
};

enum EGearShape {
    ELLIPSE = "ellipse",
    OFF_CIRCLE = "off-circle",
    HEART = "heart",
}

function callCallbacks(callbacks: VoidFunction[]): void {
    for (const callback of callbacks) {
        callback();
    }
}

Page.Tabs.addObserver(controlId.CENTRAL_GEAR_TABS_ID, () => {
    callCallbacks(Parameters.onGearShapeChange);
});

Page.Button.addObserver(controlId.RESET_BUTTON_ID, () => {
    callCallbacks(Parameters.onReset);
});

abstract class Parameters {
    public static get rotationSpeed(): number {
        return Page.Range.getValue(controlId.ROTATION_SPEED_RANGE);
    }

    public static get gearShape(): EGearShape {
        return Page.Tabs.getValues(controlId.CENTRAL_GEAR_TABS_ID)[0] as EGearShape;
    }

    public static onGearShapeChange: VoidFunction[] = [];

    public static onReset: VoidFunction[] = [];
}

export {
    EGearShape,
    Parameters,
};

