# HTML Display Ad Starter Kit

A set of useful tools and a workflow for developing HTML Ads

- Sketch Spritesheet creation
- Prep Adobe Edge Animate published files for ad network submission
- [Gulp](http://gulpjs.com/) for running tasks

## Prerequisites

- Node.js [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
- Open your terminal.app, change your current working directory to this project directory (`cd`) and upgrade npm `sudo npm install npm -g`
- Install a copy of gulp, a handy utility for doing all the things `npm install gulp -g`
- 

## Useage

Download or clone and re-init this repo.

Create a new Edge Animate and save it in the `source` directory as the ad size with a distinguishing label following a hyphen e.g. `300x250-general`, create a source directory if one doesn't exist.

Use Sketch to gather assets from source files, one Sketch file per ad, sketch 'slices' will be exported as a useable asset in the spritesheet.

Save Sketch documents by ad name in the `assets` directory. e.g. `300x250-general.sketch`. There are no hard restrictions on this naming convention it just makes it easier to track later.

If several ads share some identical assets a global sketch can be created.

Run `gulp sketch` to create stylesheets when finished, check the `assets/build` directory for output files. A `png` spritesheet and a `html` document with output examples and some javascript object notation for importing into our Edge Animate project. 

Open both the `[ad-size]_edge.js` file and the compiled spritesheet `html` file. Copy the section labeled _Javascript array for Edge Animate_ and paste it into _edge.js between the `dom: [` brackets.

Switch to Edge Animate and accept the "File updated notice" or something to that effect, when the file reloads all your assets will be placed on the stage at 0,0.


## Notes

- Recompiling the spritesheet after changing sizes or number of assets will cause the spritesheet layout to change, 

## Todo

-	[+] This readme
- [+] TinyPNG integration
- [ ] Replace SSH plugin with something more gulp friendly
- [ ] https://github.com/sindresorhus/gulp-changed for smush
