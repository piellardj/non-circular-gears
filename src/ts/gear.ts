import { Point } from "./point";

type Part = {
    radius: number;
    angle: number;
};

class Gear {
    public static draw(context: CanvasRenderingContext2D, ...gears: Gear[]): void {
        const halfWidth = 0.5 * context.canvas.width;
        const halfHeight = 0.5 * context.canvas.height;
        const factor = Math.min(halfWidth, halfHeight);

        function normalize(point: Point): void {
            point.x = halfWidth + factor * point.x;
            point.y = halfHeight + factor * point.y;
        }

        // draw body
        {
            context.fillStyle = "rgba(255,0,0,0.1)";
            context.strokeStyle = "red";

            for (const gear of gears) {
                context.beginPath();
                gear.parts.forEach((part: Part, index: number) => {
                    const point = {
                        x: gear.center.x + part.radius * Math.cos(part.angle + gear.rotation),
                        y: gear.center.y + part.radius * Math.sin(part.angle + gear.rotation),
                    };
                    normalize(point);

                    if (index === 0) {
                        context.moveTo(point.x, point.y);
                    } else {
                        context.lineTo(point.x, point.y);
                    }
                });

                context.closePath();
                context.stroke();
                context.fill();
            }
        }

        // draw line
        {
            context.strokeStyle = "green";

            context.beginPath();
            for (const gear of gears) {
                const center = {
                    x: gear.center.x,
                    y: gear.center.y,
                };
                normalize(center);
                context.moveTo(center.x, center.y);

                const part = gear.parts[0];
                if (!part) {
                    throw new Error("Gear has no parts.");
                }
                const point = {
                    x: gear.center.x + part.radius * Math.cos(part.angle + gear.rotation),
                    y: gear.center.y + part.radius * Math.sin(part.angle + gear.rotation),
                };
                normalize(point);
                context.lineTo(point.x, point.y);
            }
            context.closePath();
            context.stroke();
        }

        // draw centers
        {
            context.fillStyle = "green";
            const radius = factor * 0.02;
            for (const gear of gears) {
                const center = { x: gear.center.x, y: gear.center.y };
                normalize(center);
                context.beginPath();
                context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                context.closePath();
                context.fill();
            }
        }
    }

    public rotation: number = 0;
    private readonly center: Point;

    private readonly parts: Part[] = [];

    public constructor() {
        this.center = { x: 0, y: 0 };

        const step = 2 * Math.PI / 360;

        const a = 0.5;
        const b = 0.3;

        for (let i = 0; i < 2 * Math.PI; i += step) {
            this.parts.push({
                radius: a * b / Math.sqrt(Math.pow(b * Math.cos(i), 2) + Math.pow(a * Math.sin(i), 2)),
                angle: i,
            });
        }
    }

    public change(center: Point, other: Gear): void {
        this.center.x = center.x;
        this.center.y = center.y;

        this.parts.length = 0;

        const dX = this.center.x - other.center.x;
        const dY = this.center.y - other.center.y;
        const baseDistance = Math.sqrt(dX * dX + dY * dY);

        for (const otherPart of other.parts) {
            this.parts.push({
                radius: baseDistance - otherPart.radius,
                angle: Math.PI - otherPart.angle,
            });
        }
    }
}

export {
    Gear,
};

