import { Gear } from "../engine/gear";
import { Point } from "../engine/point";
import { Parameters } from "../parameters";
import { distance, distanceSquared } from "../utils";

abstract class Scene {
    protected readonly mainGear: Gear;
    protected secondaryGears: Gear[] = [];

    private mobileGear: Gear | null = null;

    protected constructor(mainGear: Gear) {
        this.mainGear = mainGear;
    }

    public draw(context: CanvasRenderingContext2D): void {
        if (this.mobileGear) {
            Gear.draw(context, this.mainGear, this.mobileGear, ...this.secondaryGears);
        } else {
            Gear.draw(context, this.mainGear, ...this.secondaryGears);
        }
    }

    public update(dt: number): void {
        this.mainGear.rotate(5 * dt * Parameters.rotationSpeed / 1000);

        for (const secondaryGear of this.secondaryGears) {
            secondaryGear.update();
        }
        this.mobileGear?.update();
    }

    protected attachEvents(): void {
        Page.Canvas.Observers.mouseMove.push(() => {
            const canvas = Page.Canvas.getCanvas();
            if (!canvas) {
                throw new Error();
            }

            const aspectRatio = Page.Canvas.getAspectRatio();
            const mousePosition = Page.Canvas.getMousePosition();
            const center = {
                x: (2 * mousePosition[0] - 1) * Math.max(1, aspectRatio),
                y: (2 * mousePosition[1] - 1) * Math.max(1, 1 / aspectRatio),
            };

            this.mobileGear = this.tryBuildGear(center);
            canvas.style.cursor = this.mobileGear ? "default" : "not-allowed";
        });

        Page.Canvas.Observers.mouseUp.push(() => {
            if (this.mobileGear) {
                this.secondaryGears.push(this.mobileGear);
                this.mobileGear = null;
            }
        });
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

