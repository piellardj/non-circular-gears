import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "TODO",
    description: "TODO",
    introduction: [
        "TODO",
    ],
    githubProjectName: "non-circular-gears",
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/jsvaluenoise.min.js",
        "script/main.js"
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
                    type: Demopage.supportedControls.Range,
                    title: "Rotation speed",
                    id: "rotation-speed-range-id",
                    min: -1,
                    max: 1,
                    value: 0.3,
                    step: 0.05,
                },
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
                            label: "Off-circle",
                            value: "off-circle",
                        },
                        {
                            label: "Heart",
                            value: "heart",
                        },
                        {
                            label: "Square",
                            value: "square",
                        },
                        {
                            label: "Triangle",
                            value: "triangle",
                        },
                        {
                            label: "Off-Triangle",
                            value: "off-triangle",
                        },
                        {
                            label: "Off-Square",
                            value: "off-square",
                        },
                        {
                            label: "Pentagon",
                            value: "pentagon",
                        },
                        {
                            label: "Off-Pentagon",
                            value: "off-pentagon",
                        },
                        {
                            label: "Circle",
                            value: "circle",
                        },
                        {
                            label: "Random",
                            value: "random",
                        },
                    ]
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
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show teeth",
                    id: "show-teeth-checkbox-id",
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
