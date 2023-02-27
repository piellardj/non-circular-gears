/// <reference types="./page-interface-generated" />

import { Gear } from "./engine/gear";
import { Parameters } from "./parameters";

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
    const mainGear = Gear.ellipsis({ x: 0.2, y: 0 }, 0.2, 0.1);
    // const mainGear = Gear.circle({ x: 0, y: 0 }, 0.2);
    const otherFixed = Gear.slaveGear({ x: -0.3, y: 0 }, mainGear)!;
    let other: Gear | null = Gear.slaveGear({ x: 0.4, y: 0 }, otherFixed);

    function updateMobile(): void {
        const mousePosition = Page.Canvas.getMousePosition();
        other = Gear.slaveGear({ x: 2 * mousePosition[0] - 1, y: 2 * mousePosition[1] - 1 }, otherFixed);

        const canvas = Page.Canvas.getCanvas();
        if (canvas) {
            canvas.style.cursor = other ? "" : "not-allowed";
        }
    }

    Page.Canvas.Observers.mouseMove.push((): void => {
        if (Page.Canvas.isMouseDown()) {
            updateMobile();
        }
    });
    Page.Canvas.Observers.mouseUp.push(updateMobile);

    let lastUpdate = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        const dt = now - lastUpdate;
        lastUpdate = now;

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        mainGear.rotate(5 * dt * Parameters.rotationSpeed / 1000);

        const gears = [mainGear, otherFixed];
        if (other) {
            gears.push(other);
        }

        for (const gear of gears) {
            gear.update();
        }
        Gear.draw(context, ...gears);
        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
