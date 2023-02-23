import * as fs from "fs";
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
        "script/main.js"
    ],
    indicators: [],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [],
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
