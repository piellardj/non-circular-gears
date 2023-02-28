/// <reference types="./page-interface-generated" />

const controlId = {
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
    CENTRAL_GEAR_TABS_ID: "central-gear-tabs-id",
};

enum EGearShape {
    ELLIPSE = "ellipse",
    OFF_CIRCLE = "off-circle",
    HEART = "heart",
}

Page.Tabs.addObserver(controlId.CENTRAL_GEAR_TABS_ID, () => {
    for (const callback of Parameters.onGearShapeChange) {
        callback();
    }
});

abstract class Parameters {
    public static get rotationSpeed(): number {
        return Page.Range.getValue(controlId.ROTATION_SPEED_RANGE);
    }

    public static get gearShape(): EGearShape {
        return Page.Tabs.getValues(controlId.CENTRAL_GEAR_TABS_ID)[0] as EGearShape;
    }

    public static onGearShapeChange: VoidFunction[] = [];
}

export {
    EGearShape,
    Parameters,
};

