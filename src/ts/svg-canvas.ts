/// <reference types="./page-interface-generated" />

class SvgCanvas {
    private readonly svg: SVGSVGElement;
    private readonly canvasContainer: HTMLElement;

    public constructor() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.position = "absolute";
        this.svg.style.top = "0";
        this.svg.style.left = "0";
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";
        this.svg.style.pointerEvents = "none";

        const adjustAspectRatio = (): void => {
            const width = this.width;
            const height = this.height;
            this.svg.setAttribute("viewBox", `${-0.5 * width} ${-0.5 * height} ${width} ${height}`);
        };
        Page.Canvas.Observers.canvasResize.push(adjustAspectRatio);
        adjustAspectRatio();

        this.canvasContainer = Page.Canvas.getCanvasContainer()!;
        this.canvasContainer.insertBefore(this.svg, Page.Canvas.getCanvas());
    }

    public clear(): void {
        let child = this.svg.firstChild;
        while (child) {
            this.svg.removeChild(child);
            child = this.svg.firstChild;
        }
    }

    public removeChild(child: SVGElement): void {
        this.svg.removeChild(child);
    }

    public addChild(element: SVGElement): void {
        this.svg.appendChild(element);
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

