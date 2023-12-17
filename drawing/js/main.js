window.addEventListener('load', () => {
  const canvas = document.querySelector('#draw-area');
  const context = canvas.getContext('2d');

  // 現在のマウスの位置を中心に、現在選択している線の太さを「○」で表現するために使用するcanvas
  const canvasForWidthIndicator = document.querySelector('#line-width-indicator');
  const contextForWidthIndicator = canvasForWidthIndicator.getContext('2d');

  const lastPosition = { x: null, y: null };
  let isDrag = false;
  let currentColor = '#000000';

  // 現在の線の太さを記憶する変数
  // <input id="range-selector" type="range"> の値と連動する
  var currentLineWidth = 1;

  function draw(x, y) {
    if(!isDrag) {
      return;
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = currentLineWidth;
    context.strokeStyle = currentColor;
    if (lastPosition.x === null || lastPosition.y === null) {
      context.moveTo(x, y);
    } else {
      context.moveTo(lastPosition.x, lastPosition.y);
    }
    context.lineTo(x, y);
    context.stroke();

    lastPosition.x = x;
    lastPosition.y = y;
  }

  // <canvas　id="line-width-indicator"> 上で現在のマウスの位置を中心に
  // 線の太さを表現するための「○」を描画する。
  function showLineWidthIndicator(x, y) {
    contextForWidthIndicator.lineCap = 'round';
    contextForWidthIndicator.lineJoin = 'round';
    contextForWidthIndicator.strokeStyle = currentColor;

    // 「○」の線の太さは細くて良いので1で固定
    contextForWidthIndicator.lineWidth = 5;

    // 過去に描画「○」を削除する。過去の「○」を削除しなかった場合は
    // 過去の「○」が残り続けてします。(以下の画像URLを参照)
    // https://tsuyopon.xyz/wp-content/uploads/2018/09/line-width-indicator-with-bug.gif
    contextForWidthIndicator.clearRect(0, 0, canvasForWidthIndicator.width, canvasForWidthIndicator.height);

    contextForWidthIndicator.beginPath();

    // x, y座標を中心とした円(「○」)を描画する。
    // 第3引数の「currentLineWidth / 2」で、実際に描画する線の太さと同じ大きさになる。
    // ドキュメント: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc
    contextForWidthIndicator.arc(x, y, currentLineWidth , 0, 2 * Math.PI);

    contextForWidthIndicator.stroke();
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function dragStart(event) {
    context.beginPath();

    isDrag = true;
  }

  function dragEnd(event) {
    context.closePath();
    isDrag = false;
    lastPosition.x = null;
    lastPosition.y = null;
  }

  function initEventHandler() {
    const clearButton = document.querySelector('#clear-button');
    const eraserButton = document.querySelector('#eraser-button');
    clearButton.addEventListener('click', clear);
    eraserButton.addEventListener('click', () => {
      currentColor = '#00ff00';
      currentLineWidth = (document.querySelector('#range-selector').value)*4;
    });
    const layeredCanvasArea = document.querySelector('#layerd-canvas-area');

    layeredCanvasArea.addEventListener('mousedown', dragStart);
    layeredCanvasArea.addEventListener('mouseup', dragEnd);
    layeredCanvasArea.addEventListener('mouseout', dragEnd);
    layeredCanvasArea.addEventListener('mousemove', event => {
      draw(event.layerX, event.layerY);

      showLineWidthIndicator(event.layerX, event.layerY);
    });
  }

  function initColorPalette() {
    const joe = colorjoe.rgb('color-palette', currentColor);
    joe.on('done', color => {
      currentColor = color.hex();
      currentLineWidth = document.querySelector('#range-selector').value;
    });
  }

  function initConfigOfLineWidth() {
    const textForCurrentSize = document.querySelector('#line-width');
    const rangeSelector = document.querySelector('#range-selector');

    currentLineWidth = rangeSelector.value;

    rangeSelector.addEventListener('input', event => {
      const width = event.target.value;

      currentLineWidth = width;

      textForCurrentSize.innerText = width;
    });
  }

  initEventHandler();
  initColorPalette();

  initConfigOfLineWidth();
});