import { Point } from "./engine/point";

function distanceSquared(p1: Point, p2: Point): number {
    const dX = p1.x - p2.x;
    const dY = p1.y - p2.y;
    return dX * dX + dY * dY;
}

function distance(p1: Point, p2: Point): number {
    const squared = distanceSquared(p1, p2);
    return Math.sqrt(squared);
}

function downloadTextFile(fileName: string, content: string): void {
    const fileType = "text/plain";

    const blob = new Blob([content], { type: fileType });

    type IeNavigator = Navigator & {
        msSaveBlob: (blob: Blob, filename: string) => void;
    };
    if (typeof window.navigator !== "undefined" && typeof (window.navigator as IeNavigator).msSaveBlob !== "undefined") { // for IE
        (window.navigator as IeNavigator).msSaveBlob(blob, fileName);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = fileName;
        linkElement.href = objectUrl;
        linkElement.dataset["downloadurl"] = `${fileType}:${linkElement.download}:${linkElement.href}`;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        // don't forget to free the objectURL after a few seconds
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 5000);
    }
}

export {
    distance,
    distanceSquared,
    downloadTextFile,
};

