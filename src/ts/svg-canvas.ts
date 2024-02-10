/// <reference types="./page-interface-generated" />

import { downloadTextFile } from "./utils";

type OnMouseUp = (event: MouseEvent) => void;

class SvgCanvas {
    private readonly svg: SVGSVGElement;
    private readonly styleElement: SVGStyleElement;
    private readonly backgroundElement: SVGElement;
    private readonly canvasContainer: HTMLElement;

    public onMouseUp: OnMouseUp[] = [];

    public constructor() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.position = "absolute";
        this.svg.style.top = "0";
        this.svg.style.left = "0";
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";
        this.svg.style.pointerEvents = "none";

        this.styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
        this.svg.appendChild(this.styleElement);

        this.backgroundElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.backgroundElement.setAttribute("x", "-100%");
        this.backgroundElement.setAttribute("y", "-100%");
        this.backgroundElement.setAttribute("width", "200%");
        this.backgroundElement.setAttribute("height", "200%");
        this.backgroundElement.setAttribute("fill", "black");
        this.svg.appendChild(this.backgroundElement);

        const adjustAspectRatio = (): void => {
            const width = this.width;
            const height = this.height;
            this.svg.setAttribute("viewBox", `${-0.5 * width} ${-0.5 * height} ${width} ${height}`);
        };
        Page.Canvas.Observers.canvasResize.push(adjustAspectRatio);
        adjustAspectRatio();

        const canvasContainer = Page.Canvas.getCanvasContainer();
        if (!canvasContainer) {
            throw new Error();
        }
        this.canvasContainer = canvasContainer;
        this.canvasContainer.insertBefore(this.svg, Page.Canvas.getCanvas());
        this.canvasContainer.addEventListener("mouseup", (event: MouseEvent) => {
            for (const observer of this.onMouseUp) {
                observer(event);
            }
        });
        this.canvasContainer.addEventListener("contextmenu", (event: Event) => {
            event.preventDefault();
        });
    }

    public clear(): void {
        let child = this.svg.firstChild;
        while (child) {
            this.svg.removeChild(child);
            child = this.svg.firstChild;
        }
        this.svg.appendChild(this.styleElement);
        this.svg.appendChild(this.backgroundElement);
    }

    public removeChild(child: SVGElement): void {
        this.svg.removeChild(child);
    }

    public addChild(element: SVGElement): void {
        this.svg.appendChild(element);
    }

    public download(): void {
        this.svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        this.svg.setAttribute("version", "1.1");
        const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${this.svg.outerHTML}`;
        this.svg.removeAttribute("xmlns");
        this.svg.removeAttribute("version");

        downloadTextFile("gears.svg", content);
    }

    public setStyle(style: string): void {
        this.styleElement.innerHTML = style;
    }

    public get width(): number {
        return 2 * Math.max(1, Page.Canvas.getAspectRatio());
    }

    public get height(): number {
        return 2 * Math.max(1, 1 / Page.Canvas.getAspectRatio());
    }

    public set cursor(cursor: string) {
        this.canvasContainer.style.cursor = cursor;
    }
}

export {
    SvgCanvas,
};

