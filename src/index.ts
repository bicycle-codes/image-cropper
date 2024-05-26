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
class Point {
    x:number
    y:number

    // For object pooling
    // eslint-disable-next-line -- recursive
    next?:Point

    constructor (x:number = 0, y:number = 0) {
        this.x = x
        this.y = y
    }

    setNext (p:Point) {
        this.next = p
    }

    getNext ():Point|undefined {
        return this.next
    }
}

class Handle {
    protected position:Point
    public offset:Point
    protected radius:number
    protected over:boolean = false
    protected drag:boolean = false

    constructor (x:number, y:number, radius:number) {
        this.position = new Point(x, y)
        this.offset = new Point(0, 0)
        this.radius = radius
    }

    setDrag (value:boolean) {
        this.drag = value
        this.setOver(value)
    }

    // eslint-disable-next-line -- needed for inheritance + types
    draw (ctx) {

    }

    setOver (over:boolean) {
        this.over = over
    }

    touchInBounds (x:number, y:number):boolean {
        return (x > this.position.x - this.radius && x <
        this.position.x + this.radius && y > this.position.y - this.radius && y <
        this.position.y + this.radius)
    }

    getPosition ():Point {
        return this.position
    }

    setPosition (x:number, y:number) {
        this.position.x = x
        this.position.y = y
    }
}

class PointPool {
    // eslint-disable-next-line -- recursive
    public static instance?:PointPool
    firstAvailable?:Point
    borrowed = 0  // for debugging

    constructor (inst:number) {
        PointPool.instance = this
        let prev:Point|null = null

        for (let i = 0; i < inst; i++) {
            if (i === 0) {
                this.firstAvailable = new Point()
                prev = this.firstAvailable
            } else {
                const p:Point = new Point()
                prev?.setNext(p)
                prev = p
            }
        }
    }

    borrow (x:number, y:number):Point {
        if (this.firstAvailable == null) {
            throw new Error('Pool exhausted')
        }
        this.borrowed++
        const p:Point = this.firstAvailable
        this.firstAvailable = p.getNext()
        p.x = x
        p.y = y
        return p
    }

    returnPoint (p:Point):void {
        this.borrowed--
        p.x = 0
        p.y = 0
        p.setNext(this.firstAvailable!)
        this.firstAvailable = p
    }
}

class CropService {
    public static canvas:HTMLCanvasElement
    public static ctx
    public static DEG2RAD = 0.0174532925

    public static init (canvas:HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
    }
}

class DragMarker extends Handle {
    iconPoints:Array<Point> = new Array<Point>()
    scaledIconPoints:Array<Point> = new Array<Point>()

    constructor (x:number, y:number, radius:number) {
        super(x, y, radius)

        this.getDragIconPoints(this.iconPoints, 1)
        this.getDragIconPoints(this.scaledIconPoints, 1.2)
    }

    draw (ctx) {
        if (this.over || this.drag) {
            this.drawIcon(ctx, this.scaledIconPoints)
        } else {
            this.drawIcon(ctx, this.iconPoints)
        }
    }

    getDragIconPoints (arr:Array<Point>, scale) {
        const maxLength = 17 * scale
        const arrowWidth = 14 * scale
        const arrowLength = 8 * scale
        const connectorThroat = 4 * scale

        // for TS
        if (!PointPool.instance) throw new Error('not pointpool.instance')

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

    drawIcon (ctx, points:Array<Point>) {
        ctx.beginPath()
        ctx.moveTo(points[0].x + this.position.x, points[0].y + this.position.y)

        for (let k = 0; k < points.length; k++) {
            const p:Point = points[k]
            ctx.lineTo(p.x + this.position.x, p.y + this.position.y)
        }

        ctx.closePath()
        ctx.fillStyle = 'rgba(255,228,0,1)'
        ctx.fill()
    }

    recalculatePosition (bounds) {
        const c:Point = bounds.getCentre()
        this.setPosition(c.x, c.y)
        PointPool.instance!.returnPoint(c)
    }
}

class CornerMarker extends Handle {
    // eslint-disable-next-line -- recursive
    private horizontalNeighbour?:CornerMarker
    // eslint-disable-next-line -- recursive
    private verticalNeighbour?:CornerMarker

    drawCornerBorder (ctx) {
        let sideLength:number = 10

        if (this.over || this.drag) {
            sideLength = 12
        }

        let hDirection = 1
        let vDirection = 1

        if (this.horizontalNeighbour!.position.x < this.position.x) {
            hDirection = -1
        }

        if (this.verticalNeighbour!.position.y < this.position.y) {
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

    drawCornerFill (ctx) {
        let sideLength:number = 10

        if (this.over || this.drag) {
            sideLength = 12
        }

        let hDirection = 1
        let vDirection = 1

        if (this.horizontalNeighbour!.position.x < this.position.x) {
            hDirection = -1
        }

        if (this.verticalNeighbour!.position.y < this.position.y) {
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

    moveX (x:number) {
        this.setPosition(x, this.position.y)
    }

    moveY (y:number) {
        this.setPosition(this.position.x, y)
    }

    move (x:number, y:number) {
        this.setPosition(x, y)
        this.verticalNeighbour!.moveX(x)
        this.horizontalNeighbour!.moveY(y)
    }

    addHorizontalNeighbour (neighbour:CornerMarker) {
        this.horizontalNeighbour = neighbour
    }

    addVerticalNeighbour (neighbour:CornerMarker) {
        this.verticalNeighbour = neighbour
    }

    getHorizontalNeighbour ():CornerMarker {
        return this.horizontalNeighbour!
    }

    getVerticalNeighbour ():CornerMarker {
        return this.verticalNeighbour!
    }

    draw (ctx) {
        this.drawCornerFill(ctx)
        this.drawCornerBorder(ctx)
    }
}

class Bounds {
    left:number
    right:number
    top:number
    bottom:number

    constructor (x:number = 0, y:number = 0, width:number = 0, height:number = 0) {
        this.left = x
        this.right = x + width
        this.top = y
        this.bottom = y + height
    }

    getWidth ():number {
        return Math.abs(this.right - this.left)
    }

    getHeight ():number {
        return Math.abs(this.bottom - this.top)
    }

    getCentre ():Point {
        const w = this.getWidth()
        const h = this.getHeight()

        return PointPool.instance!.borrow(this.left + (w / 2), this.top + (h / 2))
    }
}

class CropTouch {
    x:number
    y:number
    id:number = 0
    dragHandle?:Handle|null

    constructor (x:number = 0, y:number = 0, id:number = 0) {
        this.x = x
        this.y = y
        this.id = id
    }
}

export class ImageCropper {
    tl:CornerMarker
    tr:CornerMarker
    bl:CornerMarker
    br:CornerMarker
    center:DragMarker
    canvas:HTMLCanvasElement
    ctx
    keepAspect:boolean = false
    aspectRatio:number = 0
    markers:Array<CornerMarker>
    currentDragTouches:Array<CropTouch> = new Array<CropTouch>()
    srcImage?:HTMLImageElement
    buffer:HTMLCanvasElement
    cropCanvas:HTMLCanvasElement
    isMouseDown:boolean = false
    croppedImage:HTMLImageElement
    ratioW:number = 1
    ratioH:number = 1
    fileType:string = 'png'
    minXClamp?:number
    maxXClamp?:number
    minYClamp?:number
    maxYClamp?:number
    imageSet:boolean = false
    canvasWidth?:number
    canvasHeight?:number
    vertSquashRatio?:number
    pointPool:PointPool
    currentlyInteracting:boolean

    constructor (
        canvas:HTMLCanvasElement,
        x:number = 0,
        y:number = 0,
        width:number = 100,
        height:number = 50,
        keepAspect:boolean = true,
        touchRadius:number = 20
    ) {
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

    public resizeCanvas (width:number, height:number) {
        this.canvas.width = width
        this.canvas.height = height
        this.buffer.width = width
        this.buffer.height = height
        this.draw(this.ctx)
    }

    draw (ctx) {
        const bounds:Bounds = this.getBounds()

        if (this.srcImage) {
            if (!this.canvasHeight || !this.canvasWidth) {
                throw new Error('not canvas width or height')  // for TS
            }

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
                // ctx.drawImage(this.srcImage, 0, 0, this.srcImage.width, this.srcImage.height, this.buffer.width / 2 - w / 2, 0, w, h);
            } else {
                this.drawImageIOSFix(ctx, this.srcImage, 0, 0, this.srcImage.width, this.srcImage.height, 0, this.buffer.height / 2 - h / 2, w, h)
                // ctx.drawImage(this.srcImage, 0, 0, this.srcImage.width, this.srcImage.height, 0, this.buffer.height / 2 - h / 2, w, h);
            }

            this.buffer.getContext('2d')?.drawImage(this.canvas, 0, 0,
                this.canvasWidth, this.canvasHeight)

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

            ctx.drawImage(this.buffer, bounds.left, bounds.top,
                Math.max(bounds.getWidth(), 1), Math.max(bounds.getHeight(), 1), bounds.left,
                bounds.top, bounds.getWidth(), bounds.getHeight())

            let marker:CornerMarker
            for (let i:number = 0; i < this.markers.length; i++) {
                marker = this.markers[i]
                marker.draw(ctx)
            }

            this.center.draw(ctx)
            ctx.lineWidth = 2
            ctx.strokeStyle = 'rgba(255,228,0,1)'
            ctx.strokeRect(bounds.left, bounds.top, bounds.getWidth(),
                bounds.getHeight())
        } else {
            ctx.fillStyle = 'rgba(192,192,192,1)'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }

    dragCrop (x:number, y:number, marker:DragMarker) {
        const bounds:Bounds = this.getBounds()
        const left = x - (bounds.getWidth() / 2)
        const right = x + (bounds.getWidth() / 2)
        const top = y - (bounds.getHeight() / 2)
        const bottom = y + (bounds.getHeight() / 2)

        if (this.maxXClamp && right >= this.maxXClamp) {
            x = this.maxXClamp - bounds.getWidth() / 2
        }

        if (this.minXClamp && left <= this.minXClamp) {
            x = bounds.getWidth() / 2 + this.minXClamp
        }

        if (top < this.minYClamp!) {
            y = bounds.getHeight() / 2 + this.minYClamp!
        }

        if (bottom >= this.maxYClamp!) {
            y = this.maxYClamp! - bounds.getHeight() / 2
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

    dragCorner (x:number, y:number, marker:CornerMarker) {
        let iX:number = 0
        let iY:number = 0
        let ax:number = 0
        let ay:number = 0
        let newHeight:number = 0
        let newWidth:number = 0
        let newY:number = 0
        let newX:number = 0
        let anchorMarker:CornerMarker
        let fold:number = 0

        if (this.keepAspect) {
            anchorMarker = marker.getHorizontalNeighbour().getVerticalNeighbour()
            ax = anchorMarker.getPosition().x
            ay = anchorMarker.getPosition().y

            if (!PointPool.instance) {
                throw new Error('not PointPool.instance')  // for TS
            }

            if (x <= anchorMarker.getPosition().x) {
                if (y <= anchorMarker.getPosition().y) {
                    iX = ax - (100 / this.aspectRatio)
                    iY = ay - (100 / this.aspectRatio * this.aspectRatio)
                    fold = this.getSide(
                        PointPool.instance.borrow(iX, iY),
                        anchorMarker.getPosition(),
                        PointPool.instance.borrow(x, y)
                    )

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
                    fold = this.getSide(
                        PointPool.instance.borrow(iX, iY),
                        anchorMarker.getPosition(),
                        PointPool.instance.borrow(x, y)
                    )

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
                    fold = this.getSide(
                        PointPool.instance!.borrow(iX, iY),
                        anchorMarker.getPosition(),
                        PointPool.instance.borrow(x, y)
                    )

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
                    fold = this.getSide(
                        PointPool.instance!.borrow(iX, iY),
                        anchorMarker.getPosition(),
                        PointPool.instance!.borrow(x, y)
                    )

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

    getSide (a:Point, b:Point, c:Point):number {
        if (!PointPool.instance) throw new Error('not instance')  // for TS
        const n = this.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
        // TODO move the return of the pools to outside of this function
        PointPool.instance.returnPoint(a)
        PointPool.instance.returnPoint(c)
        return n
    }

    sign (x):number {
        if (+x === x) {
            return (x === 0) ? x : (x > 0) ? 1 : -1
        }
        return NaN
    }

    handleRelease (newCropTouch:CropTouch) {
        let index = 0
        for (let k = 0; k < this.currentDragTouches.length; k++) {
            if (newCropTouch.id === this.currentDragTouches[k].id) {
                this.currentDragTouches[k].dragHandle!.setDrag(false)
                newCropTouch.dragHandle = null
                index = k
            }
        }

        this.currentDragTouches.splice(index, 1)
        this.draw(this.ctx)
    }

    handleMove (newCropTouch:CropTouch) {
        let matched:boolean = false
        for (let k = 0; k < this.currentDragTouches.length; k++) {
            if (newCropTouch.id === (this.currentDragTouches[k].id &&
                this.currentDragTouches[k].dragHandle != null)) {
                const dragTouch = this.currentDragTouches[k]
                const clampedPositions:Point = this.clampPosition(
                    newCropTouch.x - dragTouch.dragHandle!.offset.x,
                    newCropTouch.y - dragTouch.dragHandle!.offset.y
                )
                newCropTouch.x = clampedPositions.x
                newCropTouch.y = clampedPositions.y
                PointPool.instance!.returnPoint(clampedPositions)

                if (dragTouch.dragHandle instanceof CornerMarker) {
                    this.dragCorner(newCropTouch.x, newCropTouch.y, <CornerMarker>dragTouch.dragHandle)
                } else {
                    this.dragCrop(newCropTouch.x, newCropTouch.y, <DragMarker>dragTouch.dragHandle)
                }
                this.currentlyInteracting = true
                matched = true
                break
            }
        }

        if (!matched) {
            // give corners precedence so the crop area can always be expanded
            for (let i:number = 0; i < this.markers.length; i++) {
                const marker:CornerMarker = this.markers[i]

                if (marker.touchInBounds(newCropTouch.x, newCropTouch.y)) {
                    newCropTouch.dragHandle = marker
                    this.currentDragTouches.push(newCropTouch)
                    marker.setDrag(true)
                    newCropTouch.dragHandle.offset.x = newCropTouch.x - newCropTouch.dragHandle.getPosition().x
                    newCropTouch.dragHandle.offset.y = newCropTouch.y - newCropTouch.dragHandle.getPosition().y
                    this.dragCorner(newCropTouch.x - newCropTouch.dragHandle.offset.x, newCropTouch.y - newCropTouch.dragHandle.offset.y, <CornerMarker>newCropTouch.dragHandle)
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
                    this.dragCrop(newCropTouch.x - newCropTouch.dragHandle.offset.x, newCropTouch.y - newCropTouch.dragHandle.offset.y, <DragMarker>newCropTouch.dragHandle)
                }
            }
        }
    }

    updateClampBounds () {
        if (!this.srcImage) throw new Error('not srcImage')  // for TS
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

    getCropBounds ():Bounds {
        if (!this.minXClamp || !this.minYClamp) throw new Error('not min clamps')
        const h = this.canvas.height - (this.minYClamp * 2)
        const bounds:Bounds = this.getBounds()
        bounds.top = Math.round((h - bounds.top + this.minYClamp) / this.ratioH)
        bounds.bottom = Math.round((h - bounds.bottom + this.minYClamp) / this.ratioH)
        bounds.left = Math.round((bounds.left - this.minXClamp) / this.ratioW)
        bounds.right = Math.round((bounds.right - this.minXClamp) / this.ratioW)

        return bounds
    }

    clampPosition (x:number, y:number):Point {
        if (x < this.minXClamp!) {
            x = this.minXClamp!
        }

        if (x > this.maxXClamp!) {
            x = this.maxXClamp!
        }

        if (y < this.minYClamp!) {
            y = this.minYClamp!
        }

        if (y > this.maxYClamp!) {
            y = this.maxYClamp!
        }

        return PointPool.instance!.borrow(x, y)
    }

    isImageSet ():boolean {
        return this.imageSet
    }

    setImage (img:HTMLImageElement) {
        if (!img) {
            throw new Error('Image is null')
        }

        this.imageSet = true
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const bufferContext = this.buffer.getContext('2d')
        bufferContext!.clearRect(0, 0, this.buffer.width, this.buffer.height)

        const splitName = img.src.split('.')
        const fileType = splitName[1]
        if (fileType === 'png' || fileType === 'jpg') {
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

        if (!PointPool.instance) throw new Error('not instance')  // for TS

        let tlPos:Point = PointPool.instance.borrow(
            cX - cropBounds.getWidth() / 2,
            cY + cropBounds.getHeight() / 2
        )
        let trPos:Point = PointPool.instance.borrow(
            cX + cropBounds.getWidth() / 2,
            cY + cropBounds.getHeight() / 2
        )
        let blPos:Point = PointPool.instance.borrow(
            cX - cropBounds.getWidth() / 2,
            cY - cropBounds.getHeight() / 2
        )
        let brPos:Point = PointPool.instance.borrow(
            cX + cropBounds.getWidth() / 2,
            cY - cropBounds.getHeight() / 2
        )

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

    getCroppedImage (fillWidth?:number, fillHeight?:number) {
        const bounds:Bounds = this.getBounds()

        if (!this.srcImage) {
            throw new Error('Source image not set.')
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

            this.drawImageIOSFix(this.cropCanvas.getContext('2d'), this.srcImage, Math.max(Math.round((bounds.left) / this.ratioW - offsetW), 0),
                Math.max(Math.round(bounds.top / this.ratioH - offsetH), 0), Math.max(Math.round(bounds.getWidth() / this.ratioW), 1),
                Math.max(Math.round(bounds.getHeight() / this.ratioH), 1), 0, 0, fillWidth, fillHeight)

            this.croppedImage.width = fillWidth
            this.croppedImage.height = fillHeight
        } else {
            this.cropCanvas.width = Math.max(bounds.getWidth(), 1)
            this.cropCanvas.height = Math.max(bounds.getHeight(), 1)

            this.cropCanvas.getContext('2d')!.drawImage(
                this.buffer,
                bounds.left,
                bounds.top,
                Math.max(bounds.getWidth(), 1),
                Math.max(bounds.getHeight(), 1),
                0, 0,
                bounds.getWidth(),
                bounds.getHeight()
            )

            this.croppedImage.width = this.cropCanvas.width
            this.croppedImage.height = this.cropCanvas.height
        }

        this.croppedImage.src = this.cropCanvas.toDataURL('image/' + this.fileType)
        return this.croppedImage
    }

    setBounds (bounds:Bounds) {
        let topLeft:CornerMarker
        let topRight:CornerMarker
        let bottomLeft:CornerMarker
        let bottomRight:CornerMarker

        const currentBounds:Bounds = this.getBounds()
        for (let i = 0; i < this.markers.length; i++) {
            const marker = this.markers[i]

            if (marker.getPosition().x === currentBounds.left) {
                if (marker.getPosition().y === currentBounds.top) {
                    topLeft = marker
                } else {
                    bottomLeft = marker
                }
            } else {
                if (marker.getPosition().y === currentBounds.top) {
                    topRight = marker
                } else {
                    bottomRight = marker
                }
            }
        }

        topLeft!.setPosition(bounds.left, bounds.top)
        topRight!.setPosition(bounds.right, bounds.top)
        bottomLeft!.setPosition(bounds.left, bounds.bottom)
        bottomRight!.setPosition(bounds.right, bounds.bottom)

        this.center.recalculatePosition(bounds)
        this.center.draw(this.ctx)
    }

    getBounds ():Bounds {
        let minX = Number.MAX_VALUE
        let minY = Number.MAX_VALUE
        let maxX = -Number.MAX_VALUE
        let maxY = -Number.MAX_VALUE

        for (let i:number = 0; i < this.markers.length; i++) {
            const marker:CornerMarker = this.markers[i]

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

        const bounds:Bounds = new Bounds()
        bounds.left = minX
        bounds.right = maxX
        bounds.top = minY
        bounds.bottom = maxY

        return bounds
    }

    getMousePos (canvas, evt:MouseEvent) {
        const rect = canvas.getBoundingClientRect()
        return PointPool.instance?.borrow(evt.clientX - rect.left, evt.clientY - rect.top)
    }

    getTouchPos (canvas, touch:Touch) {
        const rect = canvas.getBoundingClientRect()
        return PointPool.instance?.borrow(touch.clientX - rect.left, touch.clientY - rect.top)
    }

    onTouchMove (e:TouchEvent) {
        if (this.isImageSet()) {
            e.preventDefault()
            if (e.touches.length >= 1) {
                for (let i = 0; i < e.touches.length; i++) {
                    const touch:Touch = e.touches[i]
                    const touchPosition:Point = this.getTouchPos(this.canvas, touch)!
                    const cropTouch = new CropTouch(touchPosition.x, touchPosition.y, touch.identifier)
                    PointPool.instance?.returnPoint(touchPosition)
                    this.move(cropTouch)
                }
            }

            this.draw(this.ctx)
        }
    }

    onMouseMove (e:MouseEvent) {
        if (this.isImageSet()) {
            const mousePosition:Point = this.getMousePos(this.canvas, e)!

            this.move(new CropTouch(mousePosition.x, mousePosition.y, 0))
            let dragTouch:CropTouch|undefined = this.getDragTouchForID(0)
            if (dragTouch) {
                dragTouch.x = mousePosition.x
                dragTouch.y = mousePosition.y
            } else {
                dragTouch = new CropTouch(mousePosition.x, mousePosition.y, 0)
            }

            PointPool.instance!.returnPoint(mousePosition)
            this.drawCursors(dragTouch)
            this.draw(this.ctx)
        }
    }

    move (cropTouch:CropTouch) {
        if (this.isMouseDown) {
            this.handleMove(cropTouch)
        }
    }

    getDragTouchForID (id:number):CropTouch|undefined {
        for (let i = 0; i < this.currentDragTouches.length; i++) {
            if (id === this.currentDragTouches[i].id) {
                return this.currentDragTouches[i]
            }
        }
    }

    drawCursors (cropTouch:CropTouch) {
        let cursorDrawn = false

        if (cropTouch != null) {
            if (cropTouch.dragHandle === this.center) {
                document.body.style.cursor = 'move'
                cursorDrawn = true
            }

            if (cropTouch.dragHandle != null && cropTouch.dragHandle instanceof CornerMarker) {
                this.drawCornerCursor(
                    <CornerMarker>cropTouch.dragHandle,
                    cropTouch.dragHandle.getPosition().x,
                    cropTouch.dragHandle.getPosition().y,
                )
                cursorDrawn = true
            }
        }

        let didDraw = false

        if (!cursorDrawn) {
            for (let i:number = 0; i < this.markers.length; i++) {
                didDraw = didDraw ||
                this.drawCornerCursor(this.markers[i], cropTouch.x, cropTouch.y)
            }

            if (!didDraw) {
                document.body.style.cursor = 'initial'
            }
        }

        if (!didDraw && !cursorDrawn && this.center.touchInBounds(
            cropTouch.x,
            cropTouch.y
        )) {
            this.center.setOver(true)
            document.body.style.cursor = 'move'
        } else {
            this.center.setOver(false)
        }
    }

    drawCornerCursor (marker:CornerMarker, x:number, y:number) {
        if (marker.touchInBounds(x, y)) {
            marker.setOver(true)

            if (marker.getHorizontalNeighbour().getPosition().x >
                marker.getPosition().x) {
                if (marker.getVerticalNeighbour().getPosition().y >
                    marker.getPosition().y) {
                    document.body.style.cursor = 'nwse-resize'
                } else {
                    document.body.style.cursor = 'nesw-resize'
                }
            } else {
                if (marker.getVerticalNeighbour().getPosition().y >
                    marker.getPosition().y) {
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

    onMouseDown () {
        if (this.isImageSet()) {
            this.isMouseDown = true
        }
    }

    onTouchStart () {
        if (this.isImageSet()) {
            this.isMouseDown = true
        }
    }

    onTouchEnd (e:TouchEvent) {
        if (this.isImageSet()) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch:Touch = e.changedTouches[i]
                const dragTouch:CropTouch = this.getDragTouchForID(touch.identifier)!

                if (dragTouch != null) {
                    if (
                        dragTouch.dragHandle instanceof CornerMarker ||
                        dragTouch.dragHandle instanceof DragMarker
                    ) {
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

    onMouseUp () {
        if (this.isImageSet()) {
            this.handleRelease(new CropTouch(0, 0, 0))
            this.currentlyInteracting = false
            if (this.currentDragTouches.length === 0) {
                this.isMouseDown = false
            }
        }
    }

    // http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
    drawImageIOSFix (ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        // Works only if whole image is displayed:
        // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
        // The following works correct also when only a part of the image is displayed:
        ctx.drawImage(img, sx * this.vertSquashRatio!, sy * this.vertSquashRatio!,
            sw * this.vertSquashRatio!, sh * this.vertSquashRatio!,
            dx, dy, dw, dh)
    }

    detectVerticalSquash (img:HTMLImageElement) {
        // const iw = img.naturalWidth
        const ih = img.naturalHeight
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = ih
        const ctx = canvas.getContext('2d')!
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
}
