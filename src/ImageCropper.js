const __extends = this.__extends || function (d, b) {
    for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
    function __ () { this.constructor = d }
    __.prototype = b.prototype
    d.prototype = new __()
}
/**
 * Copyright (c) 2015 Allan Bishop http://www.allanbishop.com
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 **/
/// <reference path="touch-events.d.ts" />
const Handle = (function () {
    function Handle (x, y, radius) {
        this.over = false
        this.drag = false
        this.position = new Point(x, y)
        this.offset = new Point(0, 0)
        this.radius = radius
    }
    Handle.prototype.setDrag = function (value) {
        this.drag = value
        this.setOver(value)
    }
    Handle.prototype.draw = function (ctx) {
    }
    Handle.prototype.setOver = function (over) {
        this.over = over
    }
    Handle.prototype.touchInBounds = function (x, y) {
        return (x > this.position.x - this.radius && x < this.position.x + this.radius && y > this.position.y - this.radius && y < this.position.y + this.radius)
    }
    Handle.prototype.getPosition = function () {
        return this.position
    }
    Handle.prototype.setPosition = function (x, y) {
        this.position.x = x
        this.position.y = y
    }
    return Handle
})()
const PointPool = (function () {
    function PointPool (inst) {
        this.borrowed = 0 // for debugging
        PointPool.instance = this
        let prev = null
        for (let i = 0; i < inst; i++) {
            if (i === 0) {
                this.firstAvailable = new Point()
                prev = this.firstAvailable
            } else {
                const p = new Point()
                prev.setNext(p)
                prev = p
            }
        }
    }
    PointPool.prototype.borrow = function (x, y) {
        if (this.firstAvailable == null) {
            throw 'Pool exhausted'
        }
        this.borrowed++
        const p = this.firstAvailable
        this.firstAvailable = p.getNext()
        p.x = x
        p.y = y
        return p
    }
    PointPool.prototype.returnPoint = function (p) {
        this.borrowed--
        p.x = 0
        p.y = 0
        p.setNext(this.firstAvailable)
        this.firstAvailable = p
    }
    return PointPool
})()
const CropService = (function () {
    function CropService () {
    }
    CropService.init = function (canvas) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
    }
    CropService.DEG2RAD = 0.0174532925
    return CropService
})()
const DragMarker = (function (_super) {
    __extends(DragMarker, _super)
    function DragMarker (x, y, radius) {
        _super.call(this, x, y, radius)
        this.iconPoints = []
        this.scaledIconPoints = []
        this.getDragIconPoints(this.iconPoints, 1)
        this.getDragIconPoints(this.scaledIconPoints, 1.2)
    }
    DragMarker.prototype.draw = function (ctx) {
        if (this.over || this.drag) {
            this.drawIcon(ctx, this.scaledIconPoints)
        } else {
            this.drawIcon(ctx, this.iconPoints)
        }
    }
    DragMarker.prototype.getDragIconPoints = function (arr, scale) {
        const maxLength = 17 * scale
        const arrowWidth = 14 * scale
        const arrowLength = 8 * scale
        const connectorThroat = 4 * scale
        arr.push(PointPool.instance.borrow(-connectorThroat / 2, maxLength - arrowLength))
        arr.push(PointPool.instance.borrow(-arrowWidth / 2, maxLength - arrowLength))
        arr.push(PointPool.instance.borrow(0, maxLength))
        arr.push(PointPool.instance.borrow(arrowWidth / 2, maxLength - arrowLength))
        arr.push(PointPool.instance.borrow(connectorThroat / 2, maxLength - arrowLength))
        arr.push(PointPool.instance.borrow(connectorThroat / 2, connectorThroat / 2))
        arr.push(PointPool.instance.borrow(maxLength - arrowLength, connectorThroat / 2))
        arr.push(PointPool.instance.borrow(maxLength - arrowLength, arrowWidth / 2))
        arr.push(PointPool.instance.borrow(maxLength, 0))
        arr.push(PointPool.instance.borrow(maxLength - arrowLength, -arrowWidth / 2))
        arr.push(PointPool.instance.borrow(maxLength - arrowLength, -connectorThroat / 2))
        arr.push(PointPool.instance.borrow(connectorThroat / 2, -connectorThroat / 2))
        arr.push(PointPool.instance.borrow(connectorThroat / 2, -maxLength + arrowLength))
        arr.push(PointPool.instance.borrow(arrowWidth / 2, -maxLength + arrowLength))
        arr.push(PointPool.instance.borrow(0, -maxLength))
        arr.push(PointPool.instance.borrow(-arrowWidth / 2, -maxLength + arrowLength))
        arr.push(PointPool.instance.borrow(-connectorThroat / 2, -maxLength + arrowLength))
        arr.push(PointPool.instance.borrow(-connectorThroat / 2, -connectorThroat / 2))
        arr.push(PointPool.instance.borrow(-maxLength + arrowLength, -connectorThroat / 2))
        arr.push(PointPool.instance.borrow(-maxLength + arrowLength, -arrowWidth / 2))
        arr.push(PointPool.instance.borrow(-maxLength, 0))
        arr.push(PointPool.instance.borrow(-maxLength + arrowLength, arrowWidth / 2))
        arr.push(PointPool.instance.borrow(-maxLength + arrowLength, connectorThroat / 2))
        arr.push(PointPool.instance.borrow(-connectorThroat / 2, connectorThroat / 2))
    }
    DragMarker.prototype.drawIcon = function (ctx, points) {
        ctx.beginPath()
        ctx.moveTo(points[0].x + this.position.x, points[0].y + this.position.y)
        for (let k = 0; k < points.length; k++) {
            const p = points[k]
            ctx.lineTo(p.x + this.position.x, p.y + this.position.y)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(255,228,0,1)'
        ctx.fill()
    }
    DragMarker.prototype.recalculatePosition = function (bounds) {
        const c = bounds.getCentre()
        this.setPosition(c.x, c.y)
        PointPool.instance.returnPoint(c)
    }
    return DragMarker
})(Handle)
const CornerMarker = (function (_super) {
    __extends(CornerMarker, _super)
    function CornerMarker (x, y, radius) {
        _super.call(this, x, y, radius)
    }
    CornerMarker.prototype.drawCornerBorder = function (ctx) {
        let sideLength = 10
        if (this.over || this.drag) {
            sideLength = 12
        }
        let hDirection = 1
        let vDirection = 1
        if (this.horizontalNeighbour.position.x < this.position.x) {
            hDirection = -1
        }
        if (this.verticalNeighbour.position.y < this.position.y) {
            vDirection = -1
        }
        ctx.beginPath()
        ctx.lineJoin = 'miter'
        ctx.moveTo(this.position.x, this.position.y)
        ctx.lineTo(this.position.x + (sideLength * hDirection), this.position.y)
        ctx.lineTo(this.position.x + (sideLength * hDirection), this.position.y + (sideLength * vDirection))
        ctx.lineTo(this.position.x, this.position.y + (sideLength * vDirection))
        ctx.lineTo(this.position.x, this.position.y)
        ctx.closePath()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255,228,0,1)'
        ctx.stroke()
    }
    CornerMarker.prototype.drawCornerFill = function (ctx) {
        let sideLength = 10
        if (this.over || this.drag) {
            sideLength = 12
        }
        let hDirection = 1
        let vDirection = 1
        if (this.horizontalNeighbour.position.x < this.position.x) {
            hDirection = -1
        }
        if (this.verticalNeighbour.position.y < this.position.y) {
            vDirection = -1
        }
        ctx.beginPath()
        ctx.moveTo(this.position.x, this.position.y)
        ctx.lineTo(this.position.x + (sideLength * hDirection), this.position.y)
        ctx.lineTo(this.position.x + (sideLength * hDirection), this.position.y + (sideLength * vDirection))
        ctx.lineTo(this.position.x, this.position.y + (sideLength * vDirection))
        ctx.lineTo(this.position.x, this.position.y)
        ctx.closePath()
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.fill()
    }
    CornerMarker.prototype.moveX = function (x) {
        this.setPosition(x, this.position.y)
    }
    CornerMarker.prototype.moveY = function (y) {
        this.setPosition(this.position.x, y)
    }
    CornerMarker.prototype.move = function (x, y) {
        this.setPosition(x, y)
        this.verticalNeighbour.moveX(x)
        this.horizontalNeighbour.moveY(y)
    }
    CornerMarker.prototype.addHorizontalNeighbour = function (neighbour) {
        this.horizontalNeighbour = neighbour
    }
    CornerMarker.prototype.addVerticalNeighbour = function (neighbour) {
        this.verticalNeighbour = neighbour
    }
    CornerMarker.prototype.getHorizontalNeighbour = function () {
        return this.horizontalNeighbour
    }
    CornerMarker.prototype.getVerticalNeighbour = function () {
        return this.verticalNeighbour
    }
    CornerMarker.prototype.draw = function (ctx) {
        this.drawCornerFill(ctx)
        this.drawCornerBorder(ctx)
    }
    return CornerMarker
})(Handle)
const Bounds = (function () {
    function Bounds (x, y, width, height) {
        if (x === void 0) { x = 0 }
        if (y === void 0) { y = 0 }
        if (width === void 0) { width = 0 }
        if (height === void 0) { height = 0 }
        this.left = x
        this.right = x + width
        this.top = y
        this.bottom = y + height
    }
    Bounds.prototype.getWidth = function () {
        return Math.abs(this.right - this.left)
    }
    Bounds.prototype.getHeight = function () {
        return Math.abs(this.bottom - this.top)
    }
    Bounds.prototype.getCentre = function () {
        const w = this.getWidth()
        const h = this.getHeight()
        return PointPool.instance.borrow(this.left + (w / 2), this.top + (h / 2))
    }
    return Bounds
})()
var Point = (function () {
    function Point (x, y) {
        if (x === void 0) { x = 0 }
        if (y === void 0) { y = 0 }
        this.x = x
        this.y = y
    }
    Point.prototype.setNext = function (p) {
        this.next = p
    }
    Point.prototype.getNext = function () {
        return this.next
    }
    return Point
})()
const CropTouch = (function () {
    function CropTouch (x, y, id) {
        if (x === void 0) { x = 0 }
        if (y === void 0) { y = 0 }
        if (id === void 0) { id = 0 }
        this.id = 0
        this.x = x
        this.y = y
        this.id = id
    }
    return CropTouch
})()
const ImageCropper = (function () {
    function ImageCropper (canvas, x, y, width, height, keepAspect, touchRadius) {
        if (x === void 0) { x = 0 }
        if (y === void 0) { y = 0 }
        if (width === void 0) { width = 100 }
        if (height === void 0) { height = 50 }
        if (keepAspect === void 0) { keepAspect = true }
        if (touchRadius === void 0) { touchRadius = 20 }
        this.keepAspect = false
        this.aspectRatio = 0
        this.currentDragTouches = []
        this.isMouseDown = false
        this.ratioW = 1
        this.ratioH = 1
        this.fileType = 'png'
        this.imageSet = false
        this.pointPool = new PointPool(200)
        CropService.init(canvas)
        this.buffer = document.createElement('canvas')
        this.cropCanvas = document.createElement('canvas')
        this.buffer.width = canvas.width
        this.buffer.height = canvas.height
        this.tl = new CornerMarker(x, y, touchRadius)
        this.tr = new CornerMarker(x + width, y, touchRadius)
        this.bl = new CornerMarker(x, y + height, touchRadius)
        this.br = new CornerMarker(x + width, y + height, touchRadius)
        this.tl.addHorizontalNeighbour(this.tr)
        this.tl.addVerticalNeighbour(this.bl)
        this.tr.addHorizontalNeighbour(this.tl)
        this.tr.addVerticalNeighbour(this.br)
        this.bl.addHorizontalNeighbour(this.br)
        this.bl.addVerticalNeighbour(this.tl)
        this.br.addHorizontalNeighbour(this.bl)
        this.br.addVerticalNeighbour(this.tr)
        this.markers = [this.tl, this.tr, this.bl, this.br]
        this.center = new DragMarker(x + (width / 2), y + (height / 2), touchRadius)
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
        this.keepAspect = keepAspect
        this.aspectRatio = height / width
        this.draw(this.ctx)
        this.croppedImage = new Image()
        this.currentlyInteracting = false
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('mouseup', this.onMouseUp.bind(this))
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
        window.addEventListener('touchmove', this.onTouchMove.bind(this), false)
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false)
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false)
    }
    ImageCropper.prototype.resizeCanvas = function (width, height) {
        this.canvas.width = width
        this.canvas.height = height
        this.buffer.width = width
        this.buffer.height = height
        this.draw(this.ctx)
    }
    ImageCropper.prototype.draw = function (ctx) {
        const bounds = this.getBounds()
        if (this.srcImage) {
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
            const sourceAspect = this.srcImage.height / this.srcImage.width
            const canvasAspect = this.canvasHeight / this.canvasWidth
            let w = this.canvasWidth
            let h = this.canvasHeight
            if (canvasAspect > sourceAspect) {
                w = this.canvasWidth
                h = this.canvasWidth * sourceAspect
            } else {
                h = this.canvasHeight
                w = this.canvasHeight / sourceAspect
            }
            this.ratioW = w / this.srcImage.width
            this.ratioH = h / this.srcImage.height
            if (canvasAspect < sourceAspect) {
                this.drawImageIOSFix(ctx, this.srcImage, 0, 0, this.srcImage.width, this.srcImage.height, this.buffer.width / 2 - w / 2, 0, w, h)
            } else {
                this.drawImageIOSFix(ctx, this.srcImage, 0, 0, this.srcImage.width, this.srcImage.height, 0, this.buffer.height / 2 - h / 2, w, h)
            }
            this.buffer.getContext('2d').drawImage(this.canvas, 0, 0, this.canvasWidth, this.canvasHeight)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
            ctx.drawImage(this.buffer, bounds.left, bounds.top, Math.max(bounds.getWidth(), 1), Math.max(bounds.getHeight(), 1), bounds.left, bounds.top, bounds.getWidth(), bounds.getHeight())
            let marker
            for (let i = 0; i < this.markers.length; i++) {
                marker = this.markers[i]
                marker.draw(ctx)
            }
            this.center.draw(ctx)
            ctx.lineWidth = 2
            ctx.strokeStyle = 'rgba(255,228,0,1)'
            ctx.strokeRect(bounds.left, bounds.top, bounds.getWidth(), bounds.getHeight())
        } else {
            ctx.fillStyle = 'rgba(192,192,192,1)'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }

    ImageCropper.prototype.dragCrop = function (x, y, marker) {
        const bounds = this.getBounds()
        const left = x - (bounds.getWidth() / 2)
        const right = x + (bounds.getWidth() / 2)
        const top = y - (bounds.getHeight() / 2)
        const bottom = y + (bounds.getHeight() / 2)
        if (right >= this.maxXClamp) {
            x = this.maxXClamp - bounds.getWidth() / 2
        }
        if (left <= this.minXClamp) {
            x = bounds.getWidth() / 2 + this.minXClamp
        }
        if (top < this.minYClamp) {
            y = bounds.getHeight() / 2 + this.minYClamp
        }
        if (bottom >= this.maxYClamp) {
            y = this.maxYClamp - bounds.getHeight() / 2
        }
        this.tl.moveX(x - (bounds.getWidth() / 2))
        this.tl.moveY(y - (bounds.getHeight() / 2))
        this.tr.moveX(x + (bounds.getWidth() / 2))
        this.tr.moveY(y - (bounds.getHeight() / 2))
        this.bl.moveX(x - (bounds.getWidth() / 2))
        this.bl.moveY(y + (bounds.getHeight() / 2))
        this.br.moveX(x + (bounds.getWidth() / 2))
        this.br.moveY(y + (bounds.getHeight() / 2))
        marker.setPosition(x, y)
    }

    ImageCropper.prototype.dragCorner = function (x, y, marker) {
        let iX = 0
        let iY = 0
        let ax = 0
        let ay = 0
        let newHeight = 0
        let newWidth = 0
        let newY = 0
        let newX = 0
        let anchorMarker
        let fold = 0
        if (this.keepAspect) {
            anchorMarker = marker.getHorizontalNeighbour().getVerticalNeighbour()
            ax = anchorMarker.getPosition().x
            ay = anchorMarker.getPosition().y
            if (x <= anchorMarker.getPosition().x) {
                if (y <= anchorMarker.getPosition().y) {
                    iX = ax - (100 / this.aspectRatio)
                    iY = ay - (100 / this.aspectRatio * this.aspectRatio)
                    fold = this.getSide(PointPool.instance.borrow(iX, iY), anchorMarker.getPosition(), PointPool.instance.borrow(x, y))
                    if (fold > 0) {
                        newHeight = Math.abs(anchorMarker.getPosition().y - y)
                        newWidth = newHeight / this.aspectRatio
                        newY = anchorMarker.getPosition().y - newHeight
                        newX = anchorMarker.getPosition().x - newWidth
                        marker.move(newX, newY)
                    } else if (fold < 0) {
                        newWidth = Math.abs(anchorMarker.getPosition().x - x)
                        newHeight = newWidth * this.aspectRatio
                        newY = anchorMarker.getPosition().y - newHeight
                        newX = anchorMarker.getPosition().x - newWidth
                        marker.move(newX, newY)
                    }
                } else {
                    iX = ax - (100 / this.aspectRatio)
                    iY = ay + (100 / this.aspectRatio * this.aspectRatio)
                    fold = this.getSide(PointPool.instance.borrow(iX, iY), anchorMarker.getPosition(), PointPool.instance.borrow(x, y))
                    if (fold > 0) {
                        newWidth = Math.abs(anchorMarker.getPosition().x - x)
                        newHeight = newWidth * this.aspectRatio
                        newY = anchorMarker.getPosition().y + newHeight
                        newX = anchorMarker.getPosition().x - newWidth
                        marker.move(newX, newY)
                    } else if (fold < 0) {
                        newHeight = Math.abs(anchorMarker.getPosition().y - y)
                        newWidth = newHeight / this.aspectRatio
                        newY = anchorMarker.getPosition().y + newHeight
                        newX = anchorMarker.getPosition().x - newWidth
                        marker.move(newX, newY)
                    }
                }
            } else {
                if (y <= anchorMarker.getPosition().y) {
                    iX = ax + (100 / this.aspectRatio)
                    iY = ay - (100 / this.aspectRatio * this.aspectRatio)
                    fold = this.getSide(PointPool.instance.borrow(iX, iY), anchorMarker.getPosition(), PointPool.instance.borrow(x, y))
                    if (fold < 0) {
                        newHeight = Math.abs(anchorMarker.getPosition().y - y)
                        newWidth = newHeight / this.aspectRatio
                        newY = anchorMarker.getPosition().y - newHeight
                        newX = anchorMarker.getPosition().x + newWidth
                        marker.move(newX, newY)
                    } else if (fold > 0) {
                        newWidth = Math.abs(anchorMarker.getPosition().x - x)
                        newHeight = newWidth * this.aspectRatio
                        newY = anchorMarker.getPosition().y - newHeight
                        newX = anchorMarker.getPosition().x + newWidth
                        marker.move(newX, newY)
                    }
                } else {
                    iX = ax + (100 / this.aspectRatio)
                    iY = ay + (100 / this.aspectRatio * this.aspectRatio)
                    fold = this.getSide(PointPool.instance.borrow(iX, iY), anchorMarker.getPosition(), PointPool.instance.borrow(x, y))
                    if (fold < 0) {
                        newWidth = Math.abs(anchorMarker.getPosition().x - x)
                        newHeight = newWidth * this.aspectRatio
                        newY = anchorMarker.getPosition().y + newHeight
                        newX = anchorMarker.getPosition().x + newWidth
                        marker.move(newX, newY)
                    } else if (fold > 0) {
                        newHeight = Math.abs(anchorMarker.getPosition().y - y)
                        newWidth = newHeight / this.aspectRatio
                        newY = anchorMarker.getPosition().y + newHeight
                        newX = anchorMarker.getPosition().x + newWidth
                        marker.move(newX, newY)
                    }
                }
            }
        } else {
            marker.move(x, y)
        }
        this.center.recalculatePosition(this.getBounds())
    }
    ImageCropper.prototype.getSide = function (a, b, c) {
        const n = this.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
        // TODO move the return of the pools to outside of this function
        PointPool.instance.returnPoint(a)
        PointPool.instance.returnPoint(c)
        return n
    }
    ImageCropper.prototype.sign = function (x) {
        if (+x === x) {
            return (x === 0) ? x : (x > 0) ? 1 : -1
        }
        return NaN
    }
    ImageCropper.prototype.handleRelease = function (newCropTouch) {
        let index = 0
        for (let k = 0; k < this.currentDragTouches.length; k++) {
            if (newCropTouch.id == this.currentDragTouches[k].id) {
                this.currentDragTouches[k].dragHandle.setDrag(false)
                newCropTouch.dragHandle = null
                index = k
            }
        }
        this.currentDragTouches.splice(index, 1)
        this.draw(this.ctx)
    }
    ImageCropper.prototype.handleMove = function (newCropTouch) {
        let matched = false
        for (let k = 0; k < this.currentDragTouches.length; k++) {
            if (newCropTouch.id == this.currentDragTouches[k].id && this.currentDragTouches[k].dragHandle != null) {
                const dragTouch = this.currentDragTouches[k]
                const clampedPositions = this.clampPosition(newCropTouch.x - dragTouch.dragHandle.offset.x, newCropTouch.y - dragTouch.dragHandle.offset.y)
                newCropTouch.x = clampedPositions.x
                newCropTouch.y = clampedPositions.y
                PointPool.instance.returnPoint(clampedPositions)
                if (dragTouch.dragHandle instanceof CornerMarker) {
                    this.dragCorner(newCropTouch.x, newCropTouch.y, dragTouch.dragHandle)
                } else {
                    this.dragCrop(newCropTouch.x, newCropTouch.y, dragTouch.dragHandle)
                }
                this.currentlyInteracting = true
                matched = true
                break
            }
        }
        if (!matched) {
            for (let i = 0; i < this.markers.length; i++) {
                const marker = this.markers[i]
                if (marker.touchInBounds(newCropTouch.x, newCropTouch.y)) {
                    newCropTouch.dragHandle = marker
                    this.currentDragTouches.push(newCropTouch)
                    marker.setDrag(true)
                    newCropTouch.dragHandle.offset.x = newCropTouch.x - newCropTouch.dragHandle.getPosition().x
                    newCropTouch.dragHandle.offset.y = newCropTouch.y - newCropTouch.dragHandle.getPosition().y
                    this.dragCorner(newCropTouch.x - newCropTouch.dragHandle.offset.x, newCropTouch.y - newCropTouch.dragHandle.offset.y, newCropTouch.dragHandle)
                    break
                }
            }
            if (newCropTouch.dragHandle == null) {
                if (this.center.touchInBounds(newCropTouch.x, newCropTouch.y)) {
                    newCropTouch.dragHandle = this.center
                    this.currentDragTouches.push(newCropTouch)
                    newCropTouch.dragHandle.setDrag(true)
                    newCropTouch.dragHandle.offset.x = newCropTouch.x - newCropTouch.dragHandle.getPosition().x
                    newCropTouch.dragHandle.offset.y = newCropTouch.y - newCropTouch.dragHandle.getPosition().y
                    this.dragCrop(newCropTouch.x - newCropTouch.dragHandle.offset.x, newCropTouch.y - newCropTouch.dragHandle.offset.y, newCropTouch.dragHandle)
                }
            }
        }
    }
    ImageCropper.prototype.updateClampBounds = function () {
        const sourceAspect = this.srcImage.height / this.srcImage.width
        const canvasAspect = this.canvas.height / this.canvas.width
        let w = this.canvas.width
        let h = this.canvas.height
        if (canvasAspect > sourceAspect) {
            w = this.canvas.width
            h = this.canvas.width * sourceAspect
        } else {
            h = this.canvas.height
            w = this.canvas.height / sourceAspect
        }
        this.minXClamp = this.canvas.width / 2 - w / 2
        this.minYClamp = this.canvas.height / 2 - h / 2
        this.maxXClamp = this.canvas.width / 2 + w / 2
        this.maxYClamp = this.canvas.height / 2 + h / 2
    }
    ImageCropper.prototype.getCropBounds = function () {
        const h = this.canvas.height - (this.minYClamp * 2)
        const bounds = this.getBounds()
        bounds.top = Math.round((h - bounds.top + this.minYClamp) / this.ratioH)
        bounds.bottom = Math.round((h - bounds.bottom + this.minYClamp) / this.ratioH)
        bounds.left = Math.round((bounds.left - this.minXClamp) / this.ratioW)
        bounds.right = Math.round((bounds.right - this.minXClamp) / this.ratioW)
        return bounds
    }
    ImageCropper.prototype.clampPosition = function (x, y) {
        if (x < this.minXClamp) {
            x = this.minXClamp
        }
        if (x > this.maxXClamp) {
            x = this.maxXClamp
        }
        if (y < this.minYClamp) {
            y = this.minYClamp
        }
        if (y > this.maxYClamp) {
            y = this.maxYClamp
        }
        return PointPool.instance.borrow(x, y)
    }
    ImageCropper.prototype.isImageSet = function () {
        return this.imageSet
    }
    ImageCropper.prototype.setImage = function (img) {
        if (!img) {
            throw 'Image is null'
        }
        this.imageSet = true
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        const bufferContext = this.buffer.getContext('2d')
        bufferContext.clearRect(0, 0, this.buffer.width, this.buffer.height)
        const splitName = img.src.split('.')
        const fileType = splitName[1]
        if (fileType == 'png' || fileType == 'jpg') {
            this.fileType = fileType
        }
        this.srcImage = img
        this.updateClampBounds()
        const sourceAspect = this.srcImage.height / this.srcImage.width
        const cropBounds = this.getBounds()
        const cropAspect = cropBounds.getHeight() / cropBounds.getWidth()
        const w = this.canvas.width
        const h = this.canvas.height
        this.canvasWidth = w
        this.canvasHeight = h
        const cX = this.canvas.width / 2
        const cY = this.canvas.height / 2
        let tlPos = PointPool.instance.borrow(cX - cropBounds.getWidth() / 2, cY + cropBounds.getHeight() / 2)
        let trPos = PointPool.instance.borrow(cX + cropBounds.getWidth() / 2, cY + cropBounds.getHeight() / 2)
        let blPos = PointPool.instance.borrow(cX - cropBounds.getWidth() / 2, cY - cropBounds.getHeight() / 2)
        let brPos = PointPool.instance.borrow(cX + cropBounds.getWidth() / 2, cY - cropBounds.getHeight() / 2)
        this.tl.setPosition(tlPos.x, tlPos.y)
        this.tr.setPosition(trPos.x, trPos.y)
        this.bl.setPosition(blPos.x, blPos.y)
        this.br.setPosition(brPos.x, brPos.y)
        PointPool.instance.returnPoint(tlPos)
        PointPool.instance.returnPoint(trPos)
        PointPool.instance.returnPoint(blPos)
        PointPool.instance.returnPoint(brPos)
        this.center.setPosition(cX, cY)
        if (cropAspect > sourceAspect) {
            const imageH = Math.min(w * sourceAspect, h)
            if (cropBounds.getHeight() > imageH) {
                const cropW = imageH / cropAspect
                tlPos = PointPool.instance.borrow(cX - cropW / 2, cY + imageH / 2)
                trPos = PointPool.instance.borrow(cX + cropW / 2, cY + imageH / 2)
                blPos = PointPool.instance.borrow(cX - cropW / 2, cY - imageH / 2)
                brPos = PointPool.instance.borrow(cX + cropW / 2, cY - imageH / 2)
                this.tl.setPosition(tlPos.x, tlPos.y)
                this.tr.setPosition(trPos.x, trPos.y)
                this.bl.setPosition(blPos.x, blPos.y)
                this.br.setPosition(brPos.x, brPos.y)
                PointPool.instance.returnPoint(tlPos)
                PointPool.instance.returnPoint(trPos)
                PointPool.instance.returnPoint(blPos)
                PointPool.instance.returnPoint(brPos)
            }
        } else if (cropAspect < sourceAspect) {
            const imageW = Math.min(h / sourceAspect, w)
            if (cropBounds.getWidth() > imageW) {
                const cropH = imageW * cropAspect
                tlPos = PointPool.instance.borrow(cX - imageW / 2, cY + cropH / 2)
                trPos = PointPool.instance.borrow(cX + imageW / 2, cY + cropH / 2)
                blPos = PointPool.instance.borrow(cX - imageW / 2, cY - cropH / 2)
                brPos = PointPool.instance.borrow(cX + imageW / 2, cY - cropH / 2)
                this.tl.setPosition(tlPos.x, tlPos.y)
                this.tr.setPosition(trPos.x, trPos.y)
                this.bl.setPosition(blPos.x, blPos.y)
                this.br.setPosition(brPos.x, brPos.y)
                PointPool.instance.returnPoint(tlPos)
                PointPool.instance.returnPoint(trPos)
                PointPool.instance.returnPoint(blPos)
                PointPool.instance.returnPoint(brPos)
            }
        }
        this.vertSquashRatio = this.detectVerticalSquash(img)
        this.draw(this.ctx)
    }
    ImageCropper.prototype.getCroppedImage = function (fillWidth, fillHeight) {
        const bounds = this.getBounds()
        if (!this.srcImage) {
            throw 'Source image not set.'
        }
        if (fillWidth && fillHeight) {
            const sourceAspect = this.srcImage.height / this.srcImage.width
            const canvasAspect = this.canvas.height / this.canvas.width
            let w = this.canvas.width
            let h = this.canvas.height
            if (canvasAspect > sourceAspect) {
                w = this.canvas.width
                h = this.canvas.width * sourceAspect
            } else if (canvasAspect < sourceAspect) {
                h = this.canvas.height
                w = this.canvas.height / sourceAspect
            } else {
                h = this.canvas.height
                w = this.canvas.width
            }
            this.ratioW = w / this.srcImage.width
            this.ratioH = h / this.srcImage.height
            this.cropCanvas.width = fillWidth
            this.cropCanvas.height = fillHeight
            const offsetH = (this.buffer.height - h) / 2 / this.ratioH
            const offsetW = (this.buffer.width - w) / 2 / this.ratioW
            this.drawImageIOSFix(this.cropCanvas.getContext('2d'), this.srcImage, Math.max(Math.round((bounds.left) / this.ratioW - offsetW), 0), Math.max(Math.round(bounds.top / this.ratioH - offsetH), 0), Math.max(Math.round(bounds.getWidth() / this.ratioW), 1), Math.max(Math.round(bounds.getHeight() / this.ratioH), 1), 0, 0, fillWidth, fillHeight)
            this.croppedImage.width = fillWidth
            this.croppedImage.height = fillHeight
        } else {
            this.cropCanvas.width = Math.max(bounds.getWidth(), 1)
            this.cropCanvas.height = Math.max(bounds.getHeight(), 1)
            this.cropCanvas.getContext('2d').drawImage(this.buffer, bounds.left, bounds.top, Math.max(bounds.getWidth(), 1), Math.max(bounds.getHeight(), 1), 0, 0, bounds.getWidth(), bounds.getHeight())
            this.croppedImage.width = this.cropCanvas.width
            this.croppedImage.height = this.cropCanvas.height
        }
        this.croppedImage.src = this.cropCanvas.toDataURL('image/' + this.fileType)
        return this.croppedImage
    }
    ImageCropper.prototype.setBounds = function (bounds) {
        let topLeft
        let topRight
        let bottomLeft
        let bottomRight
        const currentBounds = this.getBounds()
        for (let i = 0; i < this.markers.length; i++) {
            const marker = this.markers[i]
            if (marker.getPosition().x == currentBounds.left) {
                if (marker.getPosition().y == currentBounds.top) {
                    topLeft = marker
                } else {
                    bottomLeft = marker
                }
            } else {
                if (marker.getPosition().y == currentBounds.top) {
                    topRight = marker
                } else {
                    bottomRight = marker
                }
            }
        }
        topLeft.setPosition(bounds.left, bounds.top)
        topRight.setPosition(bounds.right, bounds.top)
        bottomLeft.setPosition(bounds.left, bounds.bottom)
        bottomRight.setPosition(bounds.right, bounds.bottom)
        this.center.recalculatePosition(bounds)
        this.center.draw(this.ctx)
    }
    ImageCropper.prototype.getBounds = function () {
        let minX = Number.MAX_VALUE
        let minY = Number.MAX_VALUE
        let maxX = -Number.MAX_VALUE
        let maxY = -Number.MAX_VALUE
        for (let i = 0; i < this.markers.length; i++) {
            const marker = this.markers[i]
            if (marker.getPosition().x < minX) {
                minX = marker.getPosition().x
            }
            if (marker.getPosition().x > maxX) {
                maxX = marker.getPosition().x
            }
            if (marker.getPosition().y < minY) {
                minY = marker.getPosition().y
            }
            if (marker.getPosition().y > maxY) {
                maxY = marker.getPosition().y
            }
        }
        const bounds = new Bounds()
        bounds.left = minX
        bounds.right = maxX
        bounds.top = minY
        bounds.bottom = maxY
        return bounds
    }
    ImageCropper.prototype.getMousePos = function (canvas, evt) {
        const rect = canvas.getBoundingClientRect()
        return PointPool.instance.borrow(evt.clientX - rect.left, evt.clientY - rect.top)
    }
    ImageCropper.prototype.getTouchPos = function (canvas, touch) {
        const rect = canvas.getBoundingClientRect()
        return PointPool.instance.borrow(touch.clientX - rect.left, touch.clientY - rect.top)
    }
    ImageCropper.prototype.onTouchMove = function (e) {
        if (this.isImageSet()) {
            e.preventDefault()
            if (e.touches.length >= 1) {
                for (let i = 0; i < e.touches.length; i++) {
                    const touch = e.touches[i]
                    const touchPosition = this.getTouchPos(this.canvas, touch)
                    const cropTouch = new CropTouch(touchPosition.x, touchPosition.y, touch.identifier)
                    PointPool.instance.returnPoint(touchPosition)
                    this.move(cropTouch, e)
                }
            }
            this.draw(this.ctx)
        }
    }
    ImageCropper.prototype.onMouseMove = function (e) {
        if (this.isImageSet()) {
            const mousePosition = this.getMousePos(this.canvas, e)
            this.move(new CropTouch(mousePosition.x, mousePosition.y, 0), e)
            let dragTouch = this.getDragTouchForID(0)
            if (dragTouch) {
                dragTouch.x = mousePosition.x
                dragTouch.y = mousePosition.y
            } else {
                dragTouch = new CropTouch(mousePosition.x, mousePosition.y, 0)
            }
            PointPool.instance.returnPoint(mousePosition)
            this.drawCursors(dragTouch, e)
            this.draw(this.ctx)
        }
    }
    ImageCropper.prototype.move = function (cropTouch, e) {
        if (this.isMouseDown) {
            this.handleMove(cropTouch)
        }
    }
    ImageCropper.prototype.getDragTouchForID = function (id) {
        for (let i = 0; i < this.currentDragTouches.length; i++) {
            if (id == this.currentDragTouches[i].id) {
                return this.currentDragTouches[i]
            }
        }
    }
    ImageCropper.prototype.drawCursors = function (cropTouch, e) {
        let cursorDrawn = false
        if (cropTouch != null) {
            if (cropTouch.dragHandle == this.center) {
                document.body.style.cursor = 'move'
                cursorDrawn = true
            }
            if (cropTouch.dragHandle != null && cropTouch.dragHandle instanceof CornerMarker) {
                this.drawCornerCursor(cropTouch.dragHandle, cropTouch.dragHandle.getPosition().x, cropTouch.dragHandle.getPosition().y, e)
                cursorDrawn = true
            }
        }
        let didDraw = false
        if (!cursorDrawn) {
            for (let i = 0; i < this.markers.length; i++) {
                didDraw = didDraw || this.drawCornerCursor(this.markers[i], cropTouch.x, cropTouch.y, e)
            }
            if (!didDraw) {
                document.body.style.cursor = 'initial'
            }
        }
        if (!didDraw && !cursorDrawn && this.center.touchInBounds(cropTouch.x, cropTouch.y)) {
            this.center.setOver(true)
            document.body.style.cursor = 'move'
        } else {
            this.center.setOver(false)
        }
    }
    ImageCropper.prototype.drawCornerCursor = function (marker, x, y, e) {
        if (marker.touchInBounds(x, y)) {
            marker.setOver(true)
            if (marker.getHorizontalNeighbour().getPosition().x > marker.getPosition().x) {
                if (marker.getVerticalNeighbour().getPosition().y > marker.getPosition().y) {
                    document.body.style.cursor = 'nwse-resize'
                } else {
                    document.body.style.cursor = 'nesw-resize'
                }
            } else {
                if (marker.getVerticalNeighbour().getPosition().y > marker.getPosition().y) {
                    document.body.style.cursor = 'nesw-resize'
                } else {
                    document.body.style.cursor = 'nwse-resize'
                }
            }
            return true
        }
        marker.setOver(false)
        return false
    }
    ImageCropper.prototype.onMouseDown = function (e) {
        if (this.isImageSet()) {
            this.isMouseDown = true
        }
    }
    ImageCropper.prototype.onTouchStart = function (e) {
        if (this.isImageSet()) {
            this.isMouseDown = true
        }
    }
    ImageCropper.prototype.onTouchEnd = function (e) {
        if (this.isImageSet()) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i]
                const dragTouch = this.getDragTouchForID(touch.identifier)
                if (dragTouch != null) {
                    if (dragTouch.dragHandle instanceof CornerMarker || dragTouch.dragHandle instanceof DragMarker) {
                        dragTouch.dragHandle.setOver(false)
                    }
                    this.handleRelease(dragTouch)
                }
            }
            if (this.currentDragTouches.length === 0) {
                this.isMouseDown = false
                this.currentlyInteracting = false
            }
        }
    }
    ImageCropper.prototype.onMouseUp = function (e) {
        if (this.isImageSet()) {
            this.handleRelease(new CropTouch(0, 0, 0))
            this.currentlyInteracting = false
            if (this.currentDragTouches.length === 0) {
                this.isMouseDown = false
            }
        }
    }
    // http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
    ImageCropper.prototype.drawImageIOSFix = function (ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        // Works only if whole image is displayed:
        // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
        // The following works correct also when only a part of the image is displayed:
        ctx.drawImage(img, sx * this.vertSquashRatio, sy * this.vertSquashRatio, sw * this.vertSquashRatio, sh * this.vertSquashRatio, dx, dy, dw, dh)
    }
    ImageCropper.prototype.detectVerticalSquash = function (img) {
        const iw = img.naturalWidth; const ih = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = ih
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, 1, ih).data
        // search image edge pixel position in case it is squashed vertically.
        let sy = 0
        let ey = ih
        let py = ih
        while (py > sy) {
            const alpha = data[(py - 1) * 4 + 3]
            if (alpha === 0) {
                ey = py
            } else {
                sy = py
            }
            py = (ey + sy) >> 1
        }
        const ratio = (py / ih)
        return (ratio === 0) ? 1 : ratio
    }
    return ImageCropper
})()
// # sourceMappingURL=ImageCropper.js.map
