import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "Non-circular gears",
    description: "Non-circular gear generator",
    introduction: [
        "Gears are not always round. Non-circular gears were sketched by Leonardo da Vinci back in the 15th century. Such gears are designed to convert rotational speed in a nonconstant manner. They also look cool.",
        "This project is a non-circular gears system generator: the central gear in orange has a certain shape, and all the other gears in red are built to accomodate it. All of them have a fixed rotation axis. You can manually add more gears with the left mouse button.",
    ],
    githubProjectName: "non-circular-gears",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "main"
    },
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/jsvaluenoise.min.js",
        "script/main.min.js"
    ],
    indicators: [],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Engine",
            controls: [
                {
                    type: Demopage.supportedControls.Select,
                    title: "Central gear",
                    id: "central-gear-select-id",
                    placeholder: "<unknown>",
                    options: [
                        {
                            label: "Ellipse",
                            value: "ellipse",
                            checked: true,
                        },
                        {
                            label: "Heart",
                            value: "heart",
                        },
                        {
                            label: "Triangle",
                            value: "triangle",
                        },
                        {
                            label: "Square",
                            value: "square",
                        },
                        {
                            label: "Pentagon",
                            value: "pentagon",
                        },
                        {
                            label: "Random",
                            value: "random",
                        },
                        {
                            label: "Circle",
                            value: "circle",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Shift center",
                    id: "shift-center-checkbox-id",
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Rotation speed",
                    id: "rotation-speed-range-id",
                    min: -1,
                    max: 1,
                    value: 0.3,
                    step: 0.05,
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "reset-button",
                    label: "Reset",
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "random-button",
                    label: "Randomize",
                },
            ]
        },
        {
            title:"Display",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Style",
                    id: "display-style-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Flat",
                            value: "flat",
                            checked: true,
                        },
                        {
                            label: "Outline",
                            value: "outline",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show rays",
                    id: "show-rays-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show teeth",
                    id: "show-teeth-checkbox-id",
                    checked: true,
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Teeth size",
                    id: "teeth-size-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Small",
                            value: "small",
                        },
                        {
                            label: "Medium",
                            value: "medium",
                            checked: true,
                        },
                        {
                            label: "Large",
                            value: "large",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "download-button",
                    label: "Download",
                },
            ]
        }
    ],
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.d.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);

fse.copySync(path.resolve(SRC_DIR, "static"), DEST_DIR);
