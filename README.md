# svg2png-buffer
NodeJS module to render svg strings to png buffers.

Inspired by [svg2png-many](https://github.com/domenic/svg2png-many), [svg2png](https://github.com/domenic/svg2png) and [phantomjs-node](https://github.com/amir20/phantomjs-node).
Many thanks to them.

The main difference from [svg2png](https://github.com/domenic/svg2png) that it works **much faster** rendering SVG strings.
Because it uses one PhantomJS instance for all SVG strings you may want to render.
The main difference from [svg2png-many](https://github.com/domenic/svg2png-many)
that it does NOT work with files.
It takes an SVG string as an input value, and returns PNG buffer as an output.

## Usage

```javascript
var Promise = require("bluebird")
  , fs = Promise.promisifyAll(require('fs'))
  , svg2png = require('svg2png-buffer');

svg2png()//promise to get instance
.then(instance=>{
  //console.log(instance);//instance is an object with methods 'render' and 'close'
  instance.render(//pass SVG string as an input
`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="512" height="512">
<defs id="SvgjsDefs1001"></defs>
<rect id="SvgjsRect1006" width="512" height="512" fill="#ffffff"></rect>
<ellipse id="SvgjsEllipse1007" rx="68.5" ry="73" cx="300.5" cy="235" transform="matrix(0.9743700647852352,0.224951054343865,-0.224951054343865,0.9743700647852352,60.56529330284505,-61.57475705486172)" stroke-opacity="0.8" stroke="#000000" stroke-width="2" fill-opacity="0.8" fill="#0a0a0a"></ellipse>
</svg>`)
  .then(buffer=>{//and get it rendered as PNG buffer
    return fs.writeFileAsync(dstPath, buffer);//let's save it to file as an example
  })
  .then(()=>{
    //you don't need to close instance immediately. Call for 'render' method as many times as you need.
    //when calling 'render' in parallel, remember that PhantomJS opens new page for each image.
    instance.close();
    console.log("done");
  },err=>{
    console.log("Convert Error",err);
    instance.close();
  });
},err => {
  console.log("Get Instance error",err);
});
```
Define sizes of result png.
Height or/and width can be skipped. Aspect ration is preserved.
```javascript
var sizes = {
	height: 300,
	width: 500
};
instance.render(svgString, size).then(..
```