/// <reference types="./page-interface-generated" />

const controlId = {
    CENTRAL_GEAR_SELECT_ID: "central-gear-select-id",
    SHIFT_CENTER_CHECKBOX_ID: "shift-center-checkbox-id",
    ROTATION_SPEED_RANGE: "rotation-speed-range-id",
    RESET_BUTTON_ID: "reset-button",
    RANDOM_BUTTON_ID: "random-button",
    DISPLAY_STYLE_TABS_ID: "display-style-tabs-id",
    SHOW_RAYS_CHECKBOX_ID: "show-rays-checkbox-id",
    SHOW_TEETH_CHECKBOX_ID: "show-teeth-checkbox-id",
    TEETH_SIZE_TABS_ID: "teeth-size-tabs-id",
    DOWNLOAD_BUTTON_ID: "download-button",
};

enum EGearShape {
    ELLIPSE = "ellipse",
    HEART = "heart",
    TRIANGLE = "triangle",
    SQUARE = "square",
    PENTAGON = "pentagon",
    RANDOM = "random",
    CIRCLE = "circle",
    OFF_CIRCLE = "off-circle",
    OFF_TRIANGLE = "off-triangle",
    OFF_SQUARE = "off-square",
    OFF_PENTAGON = "off-pentagon",
}

enum EDisplayStyle {
    FLAT = "flat",
    OUTLINE = "outline",
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
Page.Checkbox.addObserver(controlId.SHIFT_CENTER_CHECKBOX_ID, () => {
    callCallbacks(Parameters.onGearShapeChange);
});

Page.Button.addObserver(controlId.RESET_BUTTON_ID, () => {
    callCallbacks(Parameters.onReset);
});

Page.Button.addObserver(controlId.DOWNLOAD_BUTTON_ID, () => {
    callCallbacks(Parameters.onDownload);
});

Page.Button.addObserver(controlId.RANDOM_BUTTON_ID, () => {
    const gearShapes = Object.values(EGearShape);
    const shapeId = Math.floor(Math.random() * gearShapes.length);
    const gearShape = gearShapes[shapeId] as string;
    Page.Select.setValue(controlId.CENTRAL_GEAR_SELECT_ID, gearShape);
    updateShiftCenterControl();
    Page.Checkbox.setChecked(controlId.SHIFT_CENTER_CHECKBOX_ID, Math.random() > 0.5);
    callCallbacks(Parameters.onReset);
});

function onDisplayStyleChange(): void {
    callCallbacks(Parameters.onDisplayStyleChange);
}
Page.Tabs.addObserver(controlId.DISPLAY_STYLE_TABS_ID, onDisplayStyleChange);
Page.Checkbox.addObserver(controlId.SHOW_RAYS_CHECKBOX_ID, onDisplayStyleChange);

abstract class Parameters {
    public static get rotationSpeed(): number {
        return Page.Range.getValue(controlId.ROTATION_SPEED_RANGE);
    }

    public static get gearShape(): EGearShape {
        const gearShape = Page.Select.getValue(controlId.CENTRAL_GEAR_SELECT_ID) as EGearShape;
        if (Parameters.shiftCenter) {
            if (gearShape === EGearShape.CIRCLE) {
                return EGearShape.OFF_CIRCLE;
            } else if (gearShape === EGearShape.TRIANGLE) {
                return EGearShape.OFF_TRIANGLE;
            } else if (gearShape === EGearShape.SQUARE) {
                return EGearShape.OFF_SQUARE;
            } else if (gearShape === EGearShape.PENTAGON) {
                return EGearShape.OFF_PENTAGON;
            }
        }
        return gearShape;
    }

    public static get displayStyle(): EDisplayStyle {
        return Page.Tabs.getValues(controlId.DISPLAY_STYLE_TABS_ID)[0] as EDisplayStyle;
    }
    public static get showRays(): boolean {
        return Page.Checkbox.isChecked(controlId.SHOW_RAYS_CHECKBOX_ID);
    }

    public static get showTeeth(): boolean {
        return Page.Checkbox.isChecked(controlId.SHOW_TEETH_CHECKBOX_ID);
    }

    public static get teethSize(): ETeethSize {
        return Page.Tabs.getValues(controlId.TEETH_SIZE_TABS_ID)[0] as ETeethSize;
    }

    private static get shiftCenter(): boolean {
        return Page.Checkbox.isChecked(controlId.SHIFT_CENTER_CHECKBOX_ID);
    }

    public static onGearShapeChange: VoidFunction[] = [];

    public static onReset: VoidFunction[] = [];

    public static onDownload: VoidFunction[] = [];

    public static onDisplayStyleChange: VoidFunction[] = [];
}

function updateTeethSizeControls(): void {
    Page.Controls.setVisibility(controlId.TEETH_SIZE_TABS_ID, Parameters.showTeeth);
}
Page.Checkbox.addObserver(controlId.SHOW_TEETH_CHECKBOX_ID, updateTeethSizeControls);
updateTeethSizeControls();

function updateShiftCenterControl(): void {
    const gearShape = Page.Select.getValue(controlId.CENTRAL_GEAR_SELECT_ID) as EGearShape;
    const visible = [EGearShape.CIRCLE, EGearShape.TRIANGLE, EGearShape.SQUARE, EGearShape.PENTAGON].includes(gearShape);
    Page.Controls.setVisibility(controlId.SHIFT_CENTER_CHECKBOX_ID, visible);
}
Page.Select.addObserver(controlId.CENTRAL_GEAR_SELECT_ID, updateShiftCenterControl);
updateShiftCenterControl();

export {
    EDisplayStyle,
    EGearShape,
    ETeethSize,
    Parameters,
};

