/// <reference types="./page-interface-generated" />

import { Parameters } from "./parameters";
import { RandomScene } from "./scenes/random-scene";
import { SvgCanvas } from "./svg-canvas";


function main(): void {
    const svgCanvas = new SvgCanvas();

    let scene = RandomScene.create(svgCanvas, Parameters.gearShape);
    scene.attach();

    function resetScene(): void {
        scene.detach();
        svgCanvas.clear();
        scene = RandomScene.create(svgCanvas, Parameters.gearShape);
        scene.attach();
    }
    Parameters.onGearShapeChange.push(resetScene);
    Parameters.onReset.push(resetScene);
    Parameters.onDownload.push(() => svgCanvas.download());

    let lastUpdate = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        const dt = now - lastUpdate;
        lastUpdate = now;

        scene.update(dt);
        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
