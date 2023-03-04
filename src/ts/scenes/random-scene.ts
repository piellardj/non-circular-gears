import { Gear } from "../engine/gear";
import type { PolarCurve } from "../engine/polar-curves";
import * as PolarCurves from "../engine/polar-curves";
import { EGearShape } from "../parameters";
import { SvgCanvas } from "../svg-canvas";
import { distance } from "../utils";
import { Scene } from "./scene";

function rand(min: number, max: number): number {
    return min + (max - min) * Math.random();
}

class RandomScene extends Scene {
    public static create(svgCanvas: SvgCanvas, centralGear: EGearShape): RandomScene {
        let bestScene = new RandomScene(svgCanvas, centralGear);

        for (let i = 0; i < 5; i++) {
            const scene = new RandomScene(svgCanvas, centralGear);
            if (scene.secondaryGears.length > bestScene.secondaryGears.length) {
                bestScene = scene;
            }
        }

        return bestScene;
    }

    private constructor(svgCanvas: SvgCanvas, centralGear: EGearShape) {
        const size = 0.1;

        let polarCurve: PolarCurve;
        switch (centralGear) {
            case EGearShape.ELLIPSE:
                polarCurve = PolarCurves.buildEllipse(size, rand(0.2, 0.6) * size);
                break;
            case EGearShape.HEART:
                polarCurve = PolarCurves.buildHeart(0.17 * size);
                break;
            case EGearShape.OFF_CIRCLE:
                polarCurve = PolarCurves.buildOffCircle(size, rand(0.3, 0.9) * size);
                break;
            case EGearShape.TRIANGLE:
                polarCurve = PolarCurves.buildPolygon(size, 3);
                break;
            case EGearShape.SQUARE:
                polarCurve = PolarCurves.buildPolygon(size, 4);
                break;
            case EGearShape.PENTAGON:
                polarCurve = PolarCurves.buildPolygon(size, 5);
                break;
            case EGearShape.OFF_TRIANGLE:
                polarCurve = PolarCurves.buildOffPolygon(size, 3, 0.6);
                break;
            case EGearShape.OFF_SQUARE:
                polarCurve = PolarCurves.buildOffPolygon(size, 4, 0.6);
                break;
            case EGearShape.OFF_PENTAGON:
                polarCurve = PolarCurves.buildOffPolygon(size, 5, 0.6);
                break;
            case EGearShape.CIRCLE:
                polarCurve = PolarCurves.buildCircle(size);
                break;
            case EGearShape.RANDOM:
                polarCurve = PolarCurves.buildRandom(size);
                break;
            default:
                throw new Error(centralGear);
        }

        const mainGear = Gear.create({ x: 0, y: 0 }, polarCurve);

        super(svgCanvas, mainGear);

        this.secondaryGears = [];

        const viewportWidth = svgCanvas.width;
        const viewportHeight = svgCanvas.height;
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

