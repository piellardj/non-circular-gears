import { Gear } from "../engine/gear";
import { Point } from "../engine/point";
import { Parameters } from "../parameters";
import { SvgCanvas } from "../svg-canvas";
import { distance, distanceSquared } from "../utils";

function removeFromArray<T>(array: T[], element: T): void {
    while (array.length > 0) {
        const index = array.indexOf(element);
        if (index < 0) {
            return;
        }
        array.splice(index, 1);
    }
}

abstract class Scene {
    protected readonly mainGear: Gear;
    protected secondaryGears: Gear[] = [];

    private readonly svgCanvas: SvgCanvas;

    private readonly onMouseMove: VoidFunction;
    private readonly onMouseUp: VoidFunction;

    private mobileGear: Gear | null = null;

    protected constructor(svgCanvas: SvgCanvas, mainGear: Gear) {
        this.svgCanvas = svgCanvas;
        this.mainGear = mainGear;

        this.onMouseMove = () => {
            const aspectRatio = Page.Canvas.getAspectRatio();
            const mousePosition = Page.Canvas.getMousePosition();
            const center = {
                x: (2 * mousePosition[0] - 1) * Math.max(1, aspectRatio),
                y: (2 * mousePosition[1] - 1) * Math.max(1, 1 / aspectRatio),
            };

            if (this.mobileGear) {
                this.svgCanvas.removeChild(this.mobileGear.svgElement);
            }
            this.mobileGear = this.tryBuildGear(center);

            if (this.mobileGear) {
                this.svgCanvas.cursor = "";
                this.svgCanvas.addChild(this.mobileGear.svgElement);
            } else {
                this.svgCanvas.cursor = "not-allowed";
            }
        };

        this.onMouseUp = () => {
            if (this.mobileGear) {
                this.secondaryGears.push(this.mobileGear);
                this.mobileGear = null;
            }
        };
    }

    public update(dt: number): void {
        this.mainGear.rotate(5 * dt * Parameters.rotationSpeed / 1000);

        for (const secondaryGear of this.secondaryGears) {
            secondaryGear.update();
        }
        this.mobileGear?.update();
    }

    public attach(): void {
        this.detach();

        Page.Canvas.Observers.mouseMove.push(this.onMouseMove);
        Page.Canvas.Observers.mouseUp.push(this.onMouseUp);

        for (const gear of [this.mainGear, ...this.secondaryGears]) {
            this.svgCanvas.addChild(gear.svgElement);
        }
    }

    public detach(): void {
        removeFromArray(Page.Canvas.Observers.mouseMove, this.onMouseMove);
        removeFromArray(Page.Canvas.Observers.mouseUp, this.onMouseUp);
    }

    protected tryBuildGear(center: Point): Gear | null {
        const closestGear = this.findClosestGear(center);

        const newGear = Gear.slaveGear(center, closestGear);
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

    private findClosestGear(center: Point): Gear {
        let closestGear = this.mainGear;
        let lowestDistance = distanceSquared(center, closestGear.center);

        for (const gear of this.secondaryGears) {
            const currentDistance = distanceSquared(center, gear.center);
            if (currentDistance < lowestDistance) {
                closestGear = gear;
                lowestDistance = currentDistance;
            }
        }

        return closestGear;
    }
}

export {
    Scene,
};

