/// <reference types="../page-interface-generated" />

import { ESurfaceType, Gear } from "../engine/gear";
import { Point } from "../engine/point";
import { EDisplayStyle, ETeethSize, Parameters } from "../parameters";
import { SvgCanvas } from "../svg-canvas";
import { distance } from "../utils";

function removeFromArray<T>(array: T[], element: T): void {
    while (array.length > 0) {
        const index = array.indexOf(element);
        if (index < 0) {
            return;
        }
        array.splice(index, 1);
    }
}

const isMobile = "ontouchstart" in window && window.innerWidth < 900;

abstract class Scene {
    protected readonly mainGear: Gear;
    protected secondaryGears: Gear[] = [];

    private readonly svgCanvas: SvgCanvas;

    private readonly onMouseMove: VoidFunction;
    private readonly onMouseUp: VoidFunction;
    private readonly onRightClick: () => void;

    private mobileGear: Gear | null = null;

    protected constructor(svgCanvas: SvgCanvas, mainGear: Gear) {
        this.svgCanvas = svgCanvas;

        const updateStyle = (): void => {
            const flatStyle = (Parameters.displayStyle === EDisplayStyle.FLAT);
            const gearColor = "red";
            const gearMainColor = "#FF6A00";
            const axisColor = flatStyle ? "#333333" : "green";

            const newStyle = `.${Gear.gearClass} {
    fill:           ${gearColor};
    fill-opacity:   ${flatStyle ? 0.7 : 0.4};
    stroke:         ${gearColor};
    stroke-width:   ${flatStyle ? 0 : 0.004};
}
.${Gear.gearClass}.${Gear.gearMainClass} {
    fill:   ${gearMainColor};
    stroke: ${gearMainColor};
}
.${Gear.gearRaysClass} {
    ${Parameters.showRays ? "" : "display: none;"}
    stroke:         ${axisColor};
    stroke-width:   0.006;
}
.${Gear.gearAxisClass} {
    fill: ${axisColor};
}`;
            this.svgCanvas.setStyle(newStyle);
        };
        Parameters.onDisplayStyleChange.push(updateStyle);
        updateStyle();

        this.mainGear = mainGear;

        this.onMouseMove = () => {
            const center = this.getMousePosition();

            if (this.mobileGear) {
                this.svgCanvas.removeChild(this.mobileGear.svgElement);
                this.mobileGear = null;
            }

            const hoveredGear = this.getHoveredGear();
            if (!hoveredGear) {
                this.mobileGear = this.tryBuildGear(center);
                if (this.mobileGear) {
                    this.svgCanvas.addChild(this.mobileGear.svgElement);
                }
            }

            this.svgCanvas.cursor = (this.mobileGear || hoveredGear) ? "" : "not-allowed";
        };

        this.onMouseUp = () => {
            if (this.mobileGear) {
                this.secondaryGears.push(this.mobileGear);
                this.mobileGear = null;
            }
        };
        this.onRightClick = () => {
            const hoveredGear = this.getHoveredGear();
            if (hoveredGear) {
                const newSecondaryGears: Gear[] = [];
                for (const gear of this.secondaryGears) {
                    if (gear.isChildOf(hoveredGear)) {
                        this.svgCanvas.removeChild(gear.svgElement);
                    } else {
                        newSecondaryGears.push(gear);
                    }
                }
                this.secondaryGears = newSecondaryGears;
                this.onMouseMove();
            }
        };
    }

    public update(dt: number): void {
        this.mainGear.rotate(5 * dt * Parameters.rotationSpeed / 1000);

        for (const secondaryGear of this.secondaryGears) {
            secondaryGear.update();
        }

        this.mobileGear?.update();

        this.updateDisplay();
    }

    public attach(): void {
        this.detach();

        Page.Canvas.Observers.mouseMove.push(this.onMouseMove);
        Page.Canvas.Observers.mouseUp.push(this.onMouseUp);
        this.svgCanvas.onRightClick.push(this.onRightClick);

        for (const gear of [this.mainGear, ...this.secondaryGears]) {
            this.svgCanvas.addChild(gear.svgElement);
        }
    }

    public detach(): void {
        removeFromArray(Page.Canvas.Observers.mouseMove, this.onMouseMove);
        removeFromArray(Page.Canvas.Observers.mouseUp, this.onMouseUp);
        removeFromArray(this.svgCanvas.onRightClick, this.onRightClick);
    }

    protected tryBuildGear(center: Point): Gear | null {
        const closestGear = this.findClosestGear(center);

        let newGear: Gear | null = null;
        try {
            newGear = Gear.slaveGear(center, closestGear);
        } catch (e: unknown) {
            console.debug(e);
        }

        if (newGear) {
            for (const existingGear of this.allGears) {
                if (existingGear !== closestGear) {
                    const margin = distance(newGear.center, existingGear.center) - newGear.maxRadius - existingGear.maxRadius;
                    if (margin <= 0) {
                        return null;
                    }
                }
            }
        }
        return newGear;
    }

    protected get allGears(): Gear[] {
        return [this.mainGear, ...this.secondaryGears];
    }

    private updateDisplay(): void {
        const showTeeth = Parameters.showTeeth;
        const teethSize = Parameters.teethSize;
        let surfaceType: ESurfaceType;
        if (showTeeth) {
            if (teethSize === ETeethSize.SMALL) {
                surfaceType = ESurfaceType.TEETH_SMALL;
            } else if (teethSize === ETeethSize.MEDIUM) {
                surfaceType = ESurfaceType.TEETH_MEDIUM;
            } else {
                surfaceType = ESurfaceType.TEETH_LARGE;
            }
        } else {
            surfaceType = ESurfaceType.SMOOTH;
        }

        for (const gear of this.allGears) {
            gear.updateDisplay(surfaceType);
        }
        this.mobileGear?.updateDisplay(surfaceType);

        const hoveredGear = this.getHoveredGear();
        const hoveredOpacity = (0.6 + 0.3 * (0.5 + 0.5 * Math.cos(performance.now() / 150))).toFixed(2);
        for (const gear of this.secondaryGears) {
            if (hoveredGear && gear.isChildOf(hoveredGear)) {
                gear.svgElement.style.opacity = hoveredOpacity;
            } else {
                gear.svgElement.style.opacity = "";
            }
        }
    }

    private getHoveredGear(): Gear | null {
        if (!this.mobileGear && !isMobile) {
            const mousePosition = this.getMousePosition();
            return this.secondaryGears.find(gear => gear.isPointInside(mousePosition)) || null;
        }
        return null;
    }

    private findClosestGear(center: Point): Gear {
        let closestGear = this.mainGear;
        let lowestDistance = distance(center, closestGear.center) - closestGear.maxRadius;

        for (const gear of this.secondaryGears) {
            const currentDistance = distance(center, gear.center) - gear.maxRadius;
            if (currentDistance < lowestDistance) {
                closestGear = gear;
                lowestDistance = currentDistance;
            }
        }

        return closestGear;
    }

    private getMousePosition(): Point {
        const aspectRatio = Page.Canvas.getAspectRatio();
        const mousePosition = Page.Canvas.getMousePosition();
        return {
            x: (2 * mousePosition[0] - 1) * Math.max(1, aspectRatio),
            y: (2 * mousePosition[1] - 1) * Math.max(1, 1 / aspectRatio),
        };
    }
}

export {
    Scene
};

