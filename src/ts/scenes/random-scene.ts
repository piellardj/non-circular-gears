import { Gear } from "../engine/gear";
import { distance } from "../utils";
import { Scene } from "./scene";

function rand(min: number, max: number): number {
    return min + (max - min) * Math.random();
}

class RandomScene extends Scene {
    public static create(viewportWidth: number, viewportHeight: number): RandomScene {
        let bestScene = new RandomScene(viewportWidth, viewportHeight);

        for (let i = 0; i < 5; i++) {
            const scene = new RandomScene(viewportWidth, viewportHeight);
            if (scene.secondaryGears.length > bestScene.secondaryGears.length) {
                bestScene = scene;
            }
        }

        return bestScene;
    }

    private constructor(viewportWidth: number, viewportHeight: number) {
        super();

        const a = rand(0.1, 0.15);
        const b = a * rand(0.2, 0.6);

        this.mainGear = Gear.ellipsis({ x: 0, y: 0 }, a, b);
        this.secondaryGears = [];

        for (let i = 0; i < 300; i++) {
            const center = {
                x: rand(-0.5 * viewportWidth, 0.5 * viewportWidth),
                y: rand(-0.5 * viewportHeight, 0.5 * viewportHeight),
            };
            const isInsideGear = !!this.allGears.find(existingGear => distance(center, existingGear.center) < existingGear.minRadius);
            if (isInsideGear) {
                continue;
            }

            const newGear = this.tryBuildGear(center);
            if (newGear && newGear.minRadius > 1.2 * Gear.centerRadius && newGear.maxRadius < 0.3) {
                this.secondaryGears.push(newGear);
            }
        }
    }
}

export {
    RandomScene,
};

