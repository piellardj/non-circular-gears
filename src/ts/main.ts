/// <reference types="./page-interface-generated" />

import { Gear } from "./gear";

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
    const gear = new Gear();
    const other = new Gear();

    other.change({ x: 0.7, y: 0 }, gear);

    Page.Canvas.Observers.mouseMove.push((): void => {
        if (Page.Canvas.isMouseDown()) {
            const mousePosition = Page.Canvas.getMousePosition();
            other.change({ x: 2 * mousePosition[0] - 1, y: 2 * mousePosition[1] - 1 }, gear);
        }
    });

    function mainLoop(): void {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        gear.rotation = Math.PI / 180 * performance.now() / 20;
        other.rotation = (Math.PI - gear.rotation) / other.periodicity;

        Gear.draw(context, gear, other);
        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
