
# Custom Conquest Template for Battlefield 6 Rule Editor

[※ このリポジトリの日本語での説明はこちらです。](./README-JP.md)

This program is a TypeScript version of Andy's visual script for the Custom Conquest Template.

Original experience:
https://bfportal.gg/experiences/custom-conquest-template/

This repository is based on a TypeScript workflow for Battlefield (BF) Rule Editor scripts.

It provides the following development features:


* When you push to GitHub, ESLint automatically checks your code syntax.
* Running `npm run build` combines multiple .ts files into a single .ts file.
  * The BF Portal Rule Editor only accepts a single TypeScript file.
* `bfportal-vitest-mock` and `vitest` are already installed, so you can easily use unit tests.

## Questions / Support

If you have questions or feedback, feel free to contact me on the PlumRice Discord server 😄

Please use the appropriate thread/channel for discussions related to this project.

https://discord.gg/Zy65k8AxH2

## Installation

0. Install Node.js.
  If you are new to JavaScript, it is recommended to download the .msi installer for the Windows x64 architecture from the following link and follow the installation steps:
  https://nodejs.org/en/download
1. Download this repository.
2. Place the PortalSDK/code folder from the official Battlefield 6 SDK into the code directory of this project.
3. Run the command npm install.

## Usage

1. Write your program in the mods folder.
2. After you finish coding, run the command npm run build.
3. Upload `dist/Script.ts` and `dist/String.json` to the BF Portal Rule Editor.

### Setting Up Strings

Add the strings you want to include in `dist/String.json`.

### How to run the tests

This project uses the `bfportal-vitest-mock` package. For how to install and use it, please refer to the section below.

https://github.com/link1345/bfportal-vitest-mock
