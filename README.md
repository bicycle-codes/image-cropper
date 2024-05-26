# Image Cropper
[![types](https://img.shields.io/npm/types/@nichoth/image-cropper?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

An HTML5 image cropping tool. Features a rectangular crop area. The crop area's aspect ratio can be enforced during dragging. The crop image can either be 1:1 or scaled to fit an area. Also supports multitouch on touch supported devices.

## fork

This is a fork of [AllanBishop/ImageCropper](https://github.com/AllanBishop/ImageCropper), just packaging and exporting ergonomically for `npm` consumption.

Thanks Allan Bishop for working in the world of open source.

## Screenshot

![Screenshot](https://raw.githubusercontent.com/AllanBishop/ImageCropper/master/screenshots/screenshot.jpg "Screenshot")

## Live demo

[Live demo on JSBin](http://jsbin.com/pajiha/45/edit?html,js,output)

## install

```sh
npm i -S @nichoth/image-cropper
```

### Add files

#### copy
Copy to a location accessible by your web server

```sh
cp ./node_modules/@nichoth/image-cropper/dist/index.min.js ./public/image-cropper.js
```

Add the script to your application.

```html
<script src="/image-cropper.js"></script>
```

### bundle
This is ergonomic to use with a JS bundler such as `vite`. Just import:

```js
import { ImageCropper } from '@nichoth/image-cropper'
```

Or import a minified file:

```js
import { ImageCropper } from '@nichoth/image-cropper/min'
```

## example
Given HTML like this

```html
<canvas id="the-canvas" width="600" height="400">
    An alternative text describing what your canvas displays.
</canvas>
```

In your JS code,

```js
import { ImageCropper } from '@nichoth/image-cropper'

const width = 600
const height = 300
const cropper = new ImageCropper(
    canvas,  // <-- HTML canvas element
    canvas.width / 2 - width / 2,  // <-- left postition of crop area
    canvas.height / 2 - height / 2,  // <-- top position of crop area
    width,  // <-- initial width of the crop area
    height,  // <-- initial height of the crop area
    true  // <-- Keep the aspect ratio to the given width and height
)
```

## Public Functions

### `ImageCropper(canvas, x, y, width, height, keepAspect, touchRadius):void`

Constructor function that initializes the image cropper.

| Parameter | Description |
| ------ | ----------- |
| canvas | The canvas element that the cropping tool will display on.|
| x      | *Optional:* The left position of the crop area. |
| y      | *Optional:* The top position of the crop area.|
| width  | *Optional:* The initial width of the crop area.|
| height | *Optional:* The initial height of the crop area. |
| keepAspect   | *Optional:* Enforces that the aspect ratio is kept when dragging the crop area. The aspect ratio is defined by the width and height paramater. |
| touchRadius  | *Optional:* The radius for detecting touches/clicks on the corner drag markers and the centre drag marker. |


### `getCroppedImage(fillWidth, fillHeight):Image`

Returns an image that is cropped from the source image based on the crop area. If no fillWidth and fillHeight is set the image will be a 1:1 crop. If fillWidth and fillHeight are set the cropped image will scale to fit. It is recommended to ensure the fillWidth and fillHeight are set to the same aspect ratio as the crop area to prevent distortion.

| Parameter | Description |
| ------ | ----------- |
| fillWidth| *Optional:* The fill width that the cropped area will map to.|
| fillHeight| *Optional:* The fill height that the cropped area will map to. |

### `setImage(image)`

Set the image for the image cropper.

| Parameter | Description |
| ------ | ----------- |
| image| The image that will be used for cropping.

### `isImageSet():boolean`

Checks to see if an image has been set.

### `getCropBounds():Bounds`

Returns the bounds (left, right, top, bottom) of the crop area relative to the original source image.

## Example code

```html
<!DOCTYPE html>
<html>
<head lang="en">
		<meta charset="UTF-8">
		<title>Image Cropper Test</title>
	</head>
	<body>
		<div>
			Select image to crop: <input type="file" id="fileInput" name="file" multiple="" />
		</div>
		<div>
			<canvas id="imageCanvas" width="600" height="400" style="border:0px solid #000000;">
			</canvas>
		</div>

		<div>
            Cropped image:
		</div>

		<div id="preview"></div>

		<script src="ImageCropperTest.js"></script>
		<script src="ImageCropper.js"></script>
	</body>
</html>
```

ImageCropperTest.js


```js
let crop;
window.onload = function () {
    const canvas = document.getElementById("imageCanvas");
    const width = 600;
    const height = 300;

    crop = new ImageCropper(
        canvas,
        canvas.width / 2 - width / 2,
        canvas.height / 2 - height / 2,
        width,
        height,
        true
    );

    window.addEventListener('mouseup', preview);
};

function preview () {
    if (crop.isImageSet()) {
        const img = crop.getCroppedImage(400, 200);
        img.onload = (function () { return previewLoaded(img); });
    }
}

function previewLoaded (img) {
    if (img) {
        document.getElementById("preview").appendChild(img);
    }
}

function handleFileSelect (evt) {
    const file = evt.target.files[0];
    const reader = new FileReader();
    const img = new Image();

    //listener required for FireFox
    img.addEventListener("load", function () {
        crop.setImage(img);
        preview();
    }, false);

    reader.onload = function () {
        img.src = reader.result;
    };

    if (file) {
        reader.readAsDataURL(file);
    }
}
```

## develop
Start a local server of the [example directory](./example/):

```sh
npm start
```

## License

MIT license. See the [LICENSE](https://github.com/nichoth/image-cropper/blob/fork/LICENSE.md) file.
