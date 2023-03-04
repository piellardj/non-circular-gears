/// <reference types="./page-interface-generated" />

const controlId = {
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
    CENTRAL_GEAR_SELECT_ID: "central-gear-select-id",
    RESET_BUTTON_ID: "reset-button",
    RANDOM_BUTTON_ID: "random-button",
    SHOW_TEETH_CHECKBOX_ID: "show-teeth-checkbox-id",
    TEETH_SIZE_TABS_ID: "teeth-size-tabs-id",
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

enum ETeethSize {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
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

    public static get showTeeth(): boolean {
        return Page.Checkbox.isChecked(controlId.SHOW_TEETH_CHECKBOX_ID);
    }

    public static get teethSize(): ETeethSize {
        return Page.Tabs.getValues(controlId.TEETH_SIZE_TABS_ID)[0] as ETeethSize;
    }

    public static onGearShapeChange: VoidFunction[] = [];

    public static onReset: VoidFunction[] = [];
}

function updateTeethSizeControls(): void {
    Page.Controls.setVisibility(controlId.TEETH_SIZE_TABS_ID, Parameters.showTeeth);
}
Page.Checkbox.addObserver(controlId.SHOW_TEETH_CHECKBOX_ID, updateTeethSizeControls);
updateTeethSizeControls();

export {
    EGearShape,
    ETeethSize,
    Parameters,
};

