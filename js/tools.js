function switchTool(newTool) {
    if (currentTool === newTool) return;

    // 모든 툴 상태 초기화
    isDrawingToolEnabled = false;
    isSmudgeToolEnabled = false;
    isBubbleToolEnabled = false;
    isBrushToolEnabled = false;
    isMopBrushEnabled = false;
    isSliceStrokeEnabled = false;
    isSprayToolEnabled = false;

    // 현재 툴의 이벤트 리스너 제거
    if (currentTool !== null) {
        const toolHandlers = getToolHandlers(currentTool);
        if (toolHandlers) {
            removeToolEventListeners(toolHandlers);
        }

        // 스펀지 도구의 추가 이벤트 리스너 제거
        if (currentTool === "bubble") {
            removeBubbleListeners();
        }
    }

    // 새로운 도구 활성화
    updateCursorForTool(newTool);
    enableTool(newTool);
    currentTool = newTool;
}


function getToolHandlers(tool) {
    if (tool === "drawing") return initializeDrawingTool();
    if (tool === "smudge") return initializeSmudgeTool(canvas);
    if (tool === "bubble") return bubble();
    if (tool === "brush") return strokeBrush();
    if (tool === "mop") return mopbrush();
    if (tool === "slice") return sliceStroke(2); 
    if (tool === "spray") return spray(); 
    return null;
}


function enableTool(tool) {
    if (tool === "drawing") {
        isDrawingToolEnabled = true;
        currentImage.src='image/scraper.png';
    } 
    else if (tool === "smudge") {
        isSmudgeToolEnabled = true;
        currentImage.src='image/too3.png';
        currentImage.style.scale = 0.9;
    } 
    else if (tool === "bubble") {
        isBubbleToolEnabled = true;
        currentImage.src='image/sponge.png';
    } 
    else if (tool === "brush") {
        isBrushToolEnabled = true;
        currentImage.src='image/too4.png';
    } 
    else if (tool === "mop") {
        isMopBrushEnabled = true;
        currentImage.src='image/too5.png';
    } 
    else if (tool === "slice") {
        isSliceStrokeEnabled = true;
        currentImage.src='image/too2.png';
    } 
    else if (tool === "spray") { 
        isSprayToolEnabled = true;
        currentImage.src='image/sprayer2.png';
    }
    const toolHandlers = getToolHandlers(tool);
    if (toolHandlers) {
        addToolEventListeners(toolHandlers);
    }
}



function addToolEventListeners(toolHandlers) {
    if (!toolHandlers) return;
    const { mouseMove, mouseDown, endStroke, mouseEnter, touchStart, touchMove, touchEnd } = toolHandlers;
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", endStroke);
    canvas.addEventListener("mouseout", endStroke);
    canvas.addEventListener("mouseenter", mouseEnter);
    canvas.addEventListener("touchstart", touchStart);
    canvas.addEventListener("touchend", touchEnd);
    canvas.addEventListener("touchcancel", touchEnd);
    canvas.addEventListener("touchmove", touchMove);
}

function removeToolEventListeners(toolHandlers) {
    if (!toolHandlers) return;
    const { mouseMove, mouseDown, endStroke, mouseEnter, touchStart, touchMove, touchEnd } = toolHandlers;
    canvas.removeEventListener("mousemove", mouseMove);
    canvas.removeEventListener("mousedown", mouseDown);
    canvas.removeEventListener("mouseup", endStroke);
    canvas.removeEventListener("mouseout", endStroke);
    canvas.removeEventListener("mouseenter", mouseEnter);
    canvas.removeEventListener("touchstart", touchStart);
    canvas.removeEventListener("touchend", touchEnd);
    canvas.removeEventListener("touchcancel", touchEnd);
    canvas.removeEventListener("touchmove", touchMove);
}



function updateCursorForTool(tool) {
    if (tool === "drawing") {
        updateCursor(0, 'image/scraper.png', 2, 2.0, 0.9, 80);
    } else if (tool === "smudge") {
        updateCursor(0, 'image/cloth.png', 1.5, 2, 0.5, 80);
    } else if (tool === "bubble") {
        updateCursor(0, 'image/sponge.png', 2, 2, 0.5, 80);
    } else if (tool === "brush") {
        updateCursor(0, 'image/brush.png', 2, 2, 0.5, 80); 
    } else if (tool === "mop") {
        updateCursor(0, 'image/mop.png', 1.7, 2, 0.5, 80); 
    } else if (tool === "slice") {
        updateCursor(0, 'image/slice.png', 1.5, 2, 0.5, 80); 
    } else if (tool === "spray") { 
        updateCursor(0, 'image/spray.png', 1.6, 2, 0.5, 80);
    }
}



const updateCursor = (angle, src, enlarge, offsetx, offsety, brushsize) => {
    const cursorImage = new Image();
    cursorImage.crossOrigin = "anonymous"; // Enable cross-origin requests
    cursorImage.src = src; 
    cursorImage.onload = () => {
        const cursorCanvas = document.createElement('canvas');
        const cursorContext = cursorCanvas.getContext('2d');
        const brushSize = brushsize * enlarge;
        cursorCanvas.width = brushSize;
        cursorCanvas.height = brushSize;

        const adjustedOffsetX = -brushSize / offsetx;
        const adjustedOffsetY = -brushSize * offsety;

        cursorContext.translate(brushSize / 2, brushSize / 2);
        cursorContext.rotate(angle);
        cursorContext.drawImage(cursorImage, adjustedOffsetX, adjustedOffsetY, brushSize, brushSize);

        const cursorDataURL = cursorCanvas.toDataURL('image/png'); // Export as a Data URL
        canvas.style.cursor = `url(${cursorDataURL}) ${brushSize / 2} ${brushSize / 2}, auto`;
    };
};

function initializeDrawingTool() {
    const colour = "#e7a4e5";
    const strokeWidth = 100;
    const varyBrightness = 8;
    let latestPoint;
    let drawing = false;
    let currentAngle;

    const varyColour = sourceColour => {
        const amount = Math.round(Math.random() * 2 * varyBrightness);
        const c = tinycolor(sourceColour);
        const varied =
            amount > varyBrightness
                ? c.brighten(amount - varyBrightness)
                : c.darken(amount);
        return varied.toHexString();
    };

    const makeBrush = size => {
        const brush = [];
        let bristleCount = Math.round(size / 1);
        const gap = strokeWidth / bristleCount;
        for (let i = 0; i < bristleCount; i++) {
            const distance =
                i === 0 ? 0 : gap * i + (Math.random() * gap) / 2 - gap / 2;
            brush.push({
                distance,
                thickness: Math.random() * 2 + 2,
                colour: varyColour(colour)
            });
        }
        return brush;
    };

    let currentBrush = makeBrush(strokeWidth);

    const rotatePoint = (distance, angle, origin) => [
        origin[0] + distance * Math.cos(angle),
        origin[1] + distance * Math.sin(angle)
    ];

    const getBearing = (origin, destination) =>
        (Math.atan2(destination[1] - origin[1], destination[0] - origin[0]) -
            Math.PI / 2) %
        (Math.PI * 2);

    const getNewAngle = (origin, destination, oldAngle) => {
        const bearing = getBearing(origin, destination);
        if (typeof oldAngle === "undefined") {
            return bearing;
        }
        return oldAngle - angleDiff(oldAngle, bearing);
    };

    const angleDiff = (angleA, angleB) => {
        const twoPi = Math.PI * 2;
        const diff =
            ((angleA - (angleB > 0 ? angleB : angleB + twoPi) + Math.PI) % twoPi) -
            Math.PI;
        return diff < -Math.PI ? diff + twoPi : diff;
    };

    const strokeBristle = (origin, destination, bristle, controlPoint) => {
        context.beginPath();
        context.moveTo(origin[0], origin[1]);
        context.strokeStyle = bristle.colour;
        context.lineWidth = bristle.thickness;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.shadowColor = bristle.colour;
        context.shadowBlur = bristle.thickness / 2;
        context.quadraticCurveTo(
            controlPoint[0],
            controlPoint[1],
            destination[0],
            destination[1]
        );
        context.stroke();
    };

    const drawStroke = (bristles, origin, destination, oldAngle, newAngle) => {
        bristles.forEach(bristle => {
            context.beginPath();
            const bristleOrigin = rotatePoint(
                bristle.distance - strokeWidth / 2,
                oldAngle,
                origin
            );

            const bristleDestination = rotatePoint(
                bristle.distance - strokeWidth / 2,
                newAngle,
                destination
            );
            const controlPoint = rotatePoint(
                bristle.distance - strokeWidth / 2,
                newAngle,
                origin
            );

            strokeBristle(bristleOrigin, bristleDestination, bristle, controlPoint);
        });
    };

    const continueStroke = newPoint => {
        if (!isDrawingToolEnabled) return;
        const newAngle = getNewAngle(latestPoint, newPoint, currentAngle);
        drawStroke(currentBrush, latestPoint, newPoint, currentAngle, newAngle);
        currentAngle = newAngle % (Math.PI * 2);
        latestPoint = newPoint;
        updateCursor(newAngle);
    };

    const startStroke = point => {
        if (!isDrawingToolEnabled) return;
        currentAngle = undefined;

        currentBrush = makeBrush(strokeWidth);
        drawing = true;
        latestPoint = point;
    };

    const getTouchPoint = evt => {
        if (!evt.currentTarget) {
            return [0, 0];
        }
        const rect = evt.currentTarget.getBoundingClientRect();
        const touch = evt.targetTouches[0];
        return [touch.clientX - rect.left, touch.clientY - rect.top];
    };

    const BUTTON = 0b01;
    const mouseButtonIsDown = buttons => (BUTTON & buttons) === BUTTON;

    const mouseMove = evt => {
        if (!drawing || !isDrawingToolEnabled) {
            return;
        }
        continueStroke([evt.offsetX, evt.offsetY]);
    };

    const mouseDown = evt => {
        if (drawing || !isDrawingToolEnabled) {
            return;
        }
        evt.preventDefault();
        canvas.addEventListener("mousemove", mouseMove, false);
        startStroke([evt.offsetX, evt.offsetY]);
    };

    const mouseEnter = evt => {
        if (!mouseButtonIsDown(evt.buttons) || drawing || !isDrawingToolEnabled) {
            return;
        }
        mouseDown(evt);
    };

    const endStroke = evt => {
        if (!drawing) {
            return;
        }
        drawing = false;
        evt.currentTarget.removeEventListener("mousemove", mouseMove, false);
    };

    const touchStart = evt => {
        if (drawing || !isDrawingToolEnabled) {
            return;
        }
        evt.preventDefault();
        startStroke(getTouchPoint(evt));
    };

    const touchMove = evt => {
        if (!drawing || !isDrawingToolEnabled) {
            return;
        }
        continueStroke(getTouchPoint(evt));
    };

    const touchEnd = evt => {
        drawing = false;
    };

    canvas.addEventListener("touchstart", touchStart, false);
    canvas.addEventListener("touchend", touchEnd, false);
    canvas.addEventListener("touchcancel", touchEnd, false);
    canvas.addEventListener("touchmove", touchMove, false);

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", endStroke, false);
    canvas.addEventListener("mouseout", endStroke, false);
    canvas.addEventListener("mouseenter", mouseEnter, false);

    const cursorImage = new Image();
    cursorImage.src = 'image/scraper.png';
    const updateCursor = (angle) => {
        const cursorCanvas = document.createElement('canvas');
        const cursorContext = cursorCanvas.getContext('2d');
        const brushSize = strokeWidth * 1.5;
        cursorCanvas.width = brushSize;
        cursorCanvas.height = brushSize;

        const offsetX = -brushSize / 2.0;
        const offsetY = -brushSize * 0.9;

        cursorContext.translate(brushSize / 2, brushSize / 2);
        cursorContext.rotate(angle);
        cursorContext.drawImage(cursorImage, offsetX, offsetY, brushSize, brushSize);

        const cursorDataURL = cursorCanvas.toDataURL('image/png');
        canvas.style.cursor = `url(${cursorDataURL}) ${brushSize / 2} ${brushSize / 2}, auto`;
    };

    return {
        mouseMove,
        mouseDown,
        endStroke,
        mouseEnter,
        touchStart,
        touchMove,
        touchEnd
    };
}



function initializeSmudgeTool() {
    updateCursor(0, 'image/cloth.png', 1, 2, 0.5, 80);
    const bs = 80; 
    const bsh = bs / 2; 
    const smudgeAmount = 0.5; 

    var mouse = { x: 0, y: 0, button: false };

    function getCanvasRelativePosition(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function mouseEvents(e) {
        const pos = getCanvasRelativePosition(e);
        mouse.x = pos.x;
        mouse.y = pos.y;
        mouse.button = e.type === "mousedown" ? true : e.type === "mouseup" ? false : mouse.button;
    }

    ["mousedown", "mouseup", "mousemove"].forEach(function (name) {
        document.addEventListener(name, mouseEvents);
    });

    var grad = context.createRadialGradient(bsh, bsh, 0, bsh, bsh, bsh);
    grad.addColorStop(0, "black");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    var v_brush = createCanvas(bs);
    v_brush.ctx.imageSmoothingEnabled = false;

    function createCanvas(w, h = w) {
        var c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.ctx = c.getContext("2d");
        return c;
    }

    function brushFrom(tmp_ctx, x, y) {
        v_brush.ctx.globalCompositeOperation = "source-over";
        v_brush.ctx.globalAlpha = 1;
        v_brush.ctx.drawImage(tmp_ctx.canvas, -(x - bsh), -(y - bsh));
        v_brush.ctx.globalCompositeOperation = "destination-in";
        v_brush.ctx.globalAlpha = 1;
        v_brush.ctx.fillStyle = grad;
        v_brush.ctx.fillRect(0, 0, bs, bs);
    }

    var tmp_canvas = createCanvas(canvas.width, canvas.height);
    var tmp_ctx = tmp_canvas.ctx;
    tmp_ctx.drawImage(canvas, 0, 0);

    var lastX;
    var lastY;

    function update(timer) {
        if (isSmudgeToolEnabled) {
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.globalAlpha = 1;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(tmp_canvas, 0, 0);

            if (mouse.button) {
                v_brush.ctx.globalAlpha = smudgeAmount;
                var dx = mouse.x - lastX;
                var dy = mouse.y - lastY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                for (var i = 0; i < dist; i += 1) {
                    var ni = i / dist;
                    brushFrom(tmp_ctx, lastX + dx * ni, lastY + dy * ni);
                    ni = (i + 1) / dist;
                    tmp_ctx.drawImage(v_brush, lastX + dx * ni - bsh, lastY + dy * ni - bsh);
                }
            } else {
                v_brush.ctx.clearRect(0, 0, bs, bs);
            }

            lastX = mouse.x;
            lastY = mouse.y;
        }
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    return {
        mouseMove: update, // Use the same function for update
        mouseDown: mouseEvents,
        endStroke: mouseEvents,
        mouseEnter: mouseEvents
    };
}

function bubble() {
    updateCursor(0, 'image/sponge.png', 1, 2, 0.5, 80); // 브러쉬 커서 설정
    let isDrawing = false; // 브러쉬 활성 상태
    const brushImage = new Image();
    brushImage.src = 'image/raindrop.png'; // 브러쉬로 사용할 이미지 경로

    // 브러쉬 이미지가 로드되었는지 확인
    let imageLoaded = false;
    brushImage.onload = () => {
        imageLoaded = true;
        console.log("Brush image loaded successfully");
    };

    const applyBrush = (x, y) => {
        if (!imageLoaded) return; // 이미지가 로드되지 않은 경우 무시
        const size = 40; // 브러쉬 크기 설정
        context.save();
        context.globalAlpha = 0.8; // 투명도 적용
        context.translate(x - size / 2, y - size / 2); // 중앙 정렬
        context.drawImage(brushImage, 0, 0, size, size);
        context.restore();
    };

    const bubbleMouseDown = (event) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        applyBrush(x, y);
    };

    const bubbleMouseMove = (event) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        applyBrush(x, y);
    };

    const bubbleMouseUp = () => {
        isDrawing = false;
    };

    // 기존 이벤트 제거
    removeBubbleListeners();

    // 이벤트 리스너 추가
    canvas.addEventListener("mousedown", bubbleMouseDown);
    canvas.addEventListener("mousemove", bubbleMouseMove);
    canvas.addEventListener("mouseup", bubbleMouseUp);
    canvas.addEventListener("mouseout", bubbleMouseUp);

    // 반환 값으로 이벤트 핸들러 제공
    return {
        mouseMove: bubbleMouseMove,
        mouseDown: bubbleMouseDown,
        endStroke: bubbleMouseUp,
        mouseEnter: bubbleMouseUp,
        touchStart: bubbleMouseDown,
        touchMove: bubbleMouseMove,
        touchEnd: bubbleMouseUp,
    };
}

// 스펀지 이벤트 리스너 제거 함수
function removeBubbleListeners() {
    if (bubbleMouseDown) {
        canvas.removeEventListener("mousedown", bubbleMouseDown);
        canvas.removeEventListener("mousemove", bubbleMouseMove);
        canvas.removeEventListener("mouseup", bubbleMouseUp);
        canvas.removeEventListener("mouseout", bubbleMouseUp);

        // 이벤트 리스너 초기화
        bubbleMouseDown = null;
        bubbleMouseMove = null;
        bubbleMouseUp = null;

        // 상태 플래그 초기화
        isBubbleToolEnabled = false;
    }
}

//브러쉬

function strokeBrush() {
    updateCursor(0, 'image/too4.png', 1, 2, 0.5, 80);

    var img = new Image();
    img.src = 'image/strokebrush.png';
    img.width = 50;

    function distanceBetween(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    context.lineJoin = context.lineCap = 'round';

    var isDrawing = false;
    var lastPoint = null;

    function mouseDown(e) {
        if (!isBrushToolEnabled) return;
        isDrawing = true;
        lastPoint = getMousePos(canvas, e);
    }

    function mouseMove(e) {
        if (!isDrawing || !isBrushToolEnabled) return; 

        var currentPoint = getMousePos(canvas, e);
        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);

        for (var i = 0; i < dist; i++) {
            var x = lastPoint.x + (Math.sin(angle) * i);
            var y = lastPoint.y + (Math.cos(angle) * i);
            context.save();
            context.translate(x, y);
            context.scale(0.6, 0.6);
            context.rotate(Math.PI * 180 / getRandomInt(0, 180));
            context.drawImage(img, 0, 0);
            context.restore();
        }

        lastPoint = currentPoint;
    }

    function endStroke() {
        isDrawing = false;
    }

    return {
        mouseMove,
        mouseDown,
        endStroke,
        mouseEnter: endStroke,
        touchStart: mouseDown,
        touchMove: mouseMove,
        touchEnd: endStroke
    };
}



function mopbrush() {
    context.globalAlpha = 0.92; // 0.6 투명도 적용 (0 ~ 1 범위)
    context.lineWidth = 80;
    context.lineJoin = context.lineCap = 'butt';
    context.strokeStyle = '#729ecd'; 

    var isDrawing = false;
    var lastPoint = null;

    function mouseDown(e) {
        if (!isMopBrushEnabled) return; 
        isDrawing = true;
        lastPoint = getMousePos(canvas, e);
    }

    function mouseMove(e) {
        if (!isDrawing || !isMopBrushEnabled) return; 

        var currentPoint = getMousePos(canvas, e);
        
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(currentPoint.x, currentPoint.y);
        context.stroke();

        context.beginPath();
        context.moveTo(lastPoint.x - 5, lastPoint.y - 5);
        context.lineTo(currentPoint.x - 5, currentPoint.y - 5);
        context.stroke();

        lastPoint = currentPoint;
    }

    function endStroke() {
        isDrawing = false;
    }

    return {
        mouseMove,
        mouseDown,
        endStroke,
        mouseEnter: endStroke,
        touchStart: mouseDown,
        touchMove: mouseMove,
        touchEnd: endStroke
    };
}

function sliceStroke(offset) {
    const bubbleImg = new Image();
    bubbleImg.src = 'image/bubble.png'; // 브러쉬로 사용할 이미지 경로

    let isDrawing = false;
    let lastPoint = null;
    let imageLoaded = false; // 이미지 로드 상태 추적

    // 이미지가 로드되었을 때 처리
    bubbleImg.onload = () => {
        console.log('Image loaded successfully');
        imageLoaded = true; // 이미지 로드 완료 상태 설정
    };

    function mouseDown(e) {
        if (!isSliceStrokeEnabled || !imageLoaded) return; // 이미지가 로드되지 않았으면 무시
        isDrawing = true;
        lastPoint = getMousePos(canvas, e);
    }

 function mouseMove(e) {
    if (!isDrawing || !isSliceStrokeEnabled || !imageLoaded) return;

    const currentPoint = getMousePos(canvas, e);
    const dx = currentPoint.x - lastPoint.x;
    const dy = currentPoint.y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // 기본 브러쉬 크기
    const baseBrushSize = offset * 30;

    for (let i = 0; i < distance; i += offset * 20) { // 간격 설정 (더 자주 또는 더 넓게 그릴 수 있음)
        const x = lastPoint.x + (dx / distance) * i;
        const y = lastPoint.y + (dy / distance) * i;

        // 크기 및 위치 랜덤화
        const randomSize = baseBrushSize * (Math.random() * 1.5 + 1); // 크기를 1x ~ 2.5x로 설정
        const randomOffsetX = Math.random() * 40 - 20; // X축으로 -20 ~ +20의 랜덤 이동
        const randomOffsetY = Math.random() * 40 - 20; // Y축으로 -20 ~ +20의 랜덤 이동
        const randomAlpha = Math.random() * 0.3 + 0.7; // 투명도 랜덤 (0.7 ~ 1)

        context.save();
        context.translate(x + randomOffsetX, y + randomOffsetY);
        context.globalAlpha = randomAlpha; // 랜덤 투명도
        context.drawImage(bubbleImg, -randomSize / 2, -randomSize / 2, randomSize, randomSize);
        context.restore();
    }

    lastPoint = currentPoint;
}

    function mouseUp() {
        isDrawing = false;
    }

    // 이벤트 핸들러 반환
    return {
        mouseMove,
        mouseDown,
        endStroke: mouseUp,
        mouseEnter: mouseUp,
        touchStart: mouseDown,
        touchMove: mouseMove,
        touchEnd: mouseUp,
    };
}


function spray() {
    var clientX, clientY, timeout;
    var density = 130;
    var isDrawing = false;

    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function mouseDown(e) {
        if (!isSprayToolEnabled) return; 
        isDrawing = true;
        context.lineJoin = context.lineCap = 'round';
        context.fillStyle = "#ffffff";
        const pos = getMousePos(canvas, e);
        clientX = pos.x;
        clientY = pos.y;

        timeout = setTimeout(function draw() {
            if (!isDrawing) return; 
            for (var i = density; i--; ) {
                var angle = getRandomFloat(0, Math.PI * 2);
                var radius = getRandomFloat(0, 40);
                context.fillRect(
                    clientX + radius * Math.cos(angle),
                    clientY + radius * Math.sin(angle), 
                    2, 2
                );
            }
            if (!timeout) return;
            timeout = setTimeout(draw, 50);
        }, 50);
    }

    function mouseMove(e) {
        if (!isDrawing || !isSprayToolEnabled) return; 
        const pos = getMousePos(canvas, e);
        clientX = pos.x;
        clientY = pos.y;
    }

    function mouseUp() {
        isDrawing = false;
        clearTimeout(timeout);
        timeout = null;
    }

    return {
        mouseMove,
        mouseDown,
        mouseUp,
        mouseEnter: mouseUp,
        touchStart: mouseDown,
        touchMove: mouseMove,
        touchEnd: mouseUp
    };
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}



