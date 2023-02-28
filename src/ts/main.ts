/// <reference types="./page-interface-generated" />

import { Parameters } from "./parameters";
import { RandomScene } from "./scenes/random-scene";

function getContext(): CanvasRenderingContext2D {
    const context = Page.Canvas.getCanvas()?.getContext("2d");
    if (!context) {
        throw new Error("Failed to get context.");
    }

    const updateCanvasSize = (): void => {
        const size = Page.Canvas.getSize();
        context.canvas.width = size[0];
        context.canvas.height = size[1];
    };

    Page.Canvas.Observers.canvasResize.push(updateCanvasSize);
    updateCanvasSize();

    return context;
}

function main(): void {
    const context = getContext();

    const aspectRatio = Page.Canvas.getAspectRatio();
    const width = 2 * Math.max(1, aspectRatio);
    const height = 2 * Math.max(1, 1 / aspectRatio);

    let scene = RandomScene.create(width, height, Parameters.gearShape);
    scene.attachEvents();

    Parameters.onGearShapeChange.push(() => {
        scene.detachEvents();
        scene = RandomScene.create(width, height, Parameters.gearShape);
        scene.attachEvents();
    });

    let lastUpdate = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        const dt = now - lastUpdate;
        lastUpdate = now;

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        scene.update(dt);
        scene.draw(context);
        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
