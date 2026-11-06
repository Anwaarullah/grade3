/* Interactive Maths — reusable building blocks for activities.
 * All helpers live on MQ.ui. See ACTIVITY_API.md for usage notes.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var ui = (MQ.ui = {});

  /**
   * Big answer buttons.
   * ui.choices(['cm', 'm', 'km'], function (value, button) {...}, { columns: 3 })
   * Options may be strings/numbers or {label, value}. Returns the container element with
   * extra methods: .mark(value, 'good'|'bad'), .disable(), .enable(), .buttons
   */
  ui.choices = function (options, onPick, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'choices', style: opts.columns ? { gridTemplateColumns: 'repeat(' + opts.columns + ', minmax(0, 1fr))' } : null });
    wrap.buttons = [];
    options.forEach(function (o) {
      var item = typeof o === 'object' && o !== null ? o : { label: String(o), value: o };
      var b = el('button', { class: 'choice', type: 'button' });
      if (item.label instanceof Node) b.appendChild(item.label);
      else b.innerHTML = item.label;
      b.value_ = item.value;
      b.addEventListener('click', function () {
        if (b.disabled) return;
        MQ.sound('click');
        onPick(item.value, b);
      });
      wrap.buttons.push(b);
      wrap.appendChild(b);
    });
    wrap.mark = function (value, kind) {
      wrap.buttons.forEach(function (b) {
        if (b.value_ === value) {
          b.classList.remove('good', 'bad');
          b.classList.add(kind);
        }
      });
    };
    wrap.disable = function () {
      wrap.buttons.forEach(function (b) {
        b.disabled = true;
      });
    };
    wrap.enable = function () {
      wrap.buttons.forEach(function (b) {
        b.disabled = false;
      });
    };
    return wrap;
  };

  /**
   * Number answer box with a Check button. Enter key also submits.
   * ui.numberInput({ unit: 'cm', half: true, onSubmit: function (num, raw) {...} })
   * `half: true` adds a "½" button for answers like 13½. num is NaN when the box
   * does not hold a number (the helper shows a gentle message itself in that case).
   * Returns { el, input, focus(), disable(), enable(), clear(), setValue(v) }
   */
  ui.numberInput = function (opts) {
    opts = opts || {};
    var input = el('input', {
      class: 'num-input',
      type: 'text',
      inputmode: opts.half ? 'decimal' : 'numeric',
      autocomplete: 'off',
      'aria-label': opts.label || 'Your answer',
      placeholder: opts.placeholder || '?',
    });
    var check = el('button', { class: 'btn btn-check', type: 'button' }, opts.button || 'Check');
    var halfBtn = opts.half
      ? el(
          'button',
          {
            class: 'btn btn-half',
            type: 'button',
            title: 'Add a half',
            onclick: function () {
              if (input.value.indexOf('½') === -1) input.value = input.value.trim() + '½';
              input.focus();
            },
          },
          '+ ½'
        )
      : null;
    var unit = opts.unit ? el('span', { class: 'num-unit' }, opts.unit) : null;
    var wrap = el('div', { class: 'num-row' }, opts.prefix ? el('span', { class: 'num-prefix' }, opts.prefix) : null, input, unit, halfBtn, check);

    function submit() {
      if (input.disabled) return;
      var raw = input.value;
      var num = MQ.util.parseNum(raw);
      if (isNaN(num)) {
        input.classList.add('shake');
        setTimeout(function () {
          input.classList.remove('shake');
        }, 400);
        input.focus();
        return;
      }
      if (opts.onSubmit) opts.onSubmit(num, raw);
    }
    check.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    var api = {
      el: wrap,
      input: input,
      focus: function () {
        setTimeout(function () {
          try {
            input.focus({ preventScroll: true });
          } catch (e) {
            input.focus();
          }
        }, 30);
      },
      disable: function () {
        input.disabled = true;
        check.disabled = true;
        if (halfBtn) halfBtn.disabled = true;
      },
      enable: function () {
        input.disabled = false;
        check.disabled = false;
        if (halfBtn) halfBtn.disabled = false;
      },
      clear: function () {
        input.value = '';
      },
      setValue: function (v) {
        input.value = v;
      },
      good: function () {
        input.classList.remove('bad');
        input.classList.add('good');
      },
      bad: function () {
        input.classList.remove('good');
        input.classList.add('bad');
      },
    };
    return api;
  };

  /** Convert a pointer event to coordinates inside an <svg> (respects viewBox scaling). */
  ui.svgPoint = function (svgEl, evt) {
    var pt = svgEl.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var m = svgEl.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    var p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  /**
   * Make something draggable inside an SVG with mouse or touch.
   * ui.drag(svgRoot, handleElement, { start(p), move(p, dx, dy), end(p) })
   * p = {x, y} in SVG coordinates; dx/dy = movement since the drag started.
   * Returns a function that removes the listeners.
   */
  ui.drag = function (svgRoot, handle, cb) {
    var startP = null;
    function down(e) {
      e.preventDefault();
      startP = ui.svgPoint(svgRoot, e);
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
      handle.classList.add('dragging');
      if (cb.start) cb.start(startP, e);
    }
    function move(e) {
      if (!startP) return;
      var p = ui.svgPoint(svgRoot, e);
      if (cb.move) cb.move(p, p.x - startP.x, p.y - startP.y, e);
    }
    function up(e) {
      if (!startP) return;
      var p = ui.svgPoint(svgRoot, e);
      startP = null;
      handle.classList.remove('dragging');
      if (cb.end) cb.end(p, e);
    }
    handle.style.touchAction = 'none';
    handle.style.cursor = 'grab';
    handle.addEventListener('pointerdown', down);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    return function () {
      handle.removeEventListener('pointerdown', down);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
  };

  /**
   * Square grid drawn in SVG.
   * var g = ui.grid({ cols: 8, rows: 6, cell: 44, pad: 16 });
   * g.svg          – the <svg> element (append it to the stage)
   * g.layer        – a <g> drawn ABOVE the grid lines, for shapes/labels
   * g.under        – a <g> drawn BELOW the grid lines, for filled squares
   * g.x(col), g.y(row) – pixel position of a grid line
   * g.cellAt(p)    – {c, r} of the cell under an SVG point, or null
   * g.fill(c, r, cls) – adds a filled square (class defaults to 'cell-fill'); returns the <rect>
   * g.half(c, r, corner, cls) – adds a half-square triangle. corner = which corner the
   *                  right angle sits in: 'tl' | 'tr' | 'bl' | 'br'
   */
  ui.grid = function (opts) {
    var cols = opts.cols || 8;
    var rows = opts.rows || 6;
    var cell = opts.cell || 44;
    var pad = opts.pad == null ? 16 : opts.pad;
    var W = cols * cell + pad * 2;
    var H = rows * cell + pad * 2;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grid-svg' + (opts.className ? ' ' + opts.className : ''), width: W, height: H, style: { maxWidth: '100%', height: 'auto' } });
    var under = svg('g', { class: 'grid-under' });
    var lines = svg('g', { class: 'grid-lines' });
    var layer = svg('g', { class: 'grid-layer' });
    for (var c = 0; c <= cols; c++) lines.appendChild(svg('line', { x1: pad + c * cell, y1: pad, x2: pad + c * cell, y2: pad + rows * cell }));
    for (var r = 0; r <= rows; r++) lines.appendChild(svg('line', { x1: pad, y1: pad + r * cell, x2: pad + cols * cell, y2: pad + r * cell }));
    root.appendChild(under);
    root.appendChild(lines);
    root.appendChild(layer);
    var g = {
      svg: root,
      under: under,
      layer: layer,
      cols: cols,
      rows: rows,
      cell: cell,
      pad: pad,
      width: W,
      height: H,
      x: function (col) {
        return pad + col * cell;
      },
      y: function (row) {
        return pad + row * cell;
      },
      cellAt: function (p) {
        var cc = Math.floor((p.x - pad) / cell);
        var rr = Math.floor((p.y - pad) / cell);
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) return null;
        return { c: cc, r: rr };
      },
      fill: function (cc, rr, cls) {
        var rect = svg('rect', { x: pad + cc * cell, y: pad + rr * cell, width: cell, height: cell, class: cls || 'cell-fill' });
        under.appendChild(rect);
        return rect;
      },
      half: function (cc, rr, corner, cls) {
        var x0 = pad + cc * cell;
        var y0 = pad + rr * cell;
        var x1 = x0 + cell;
        var y1 = y0 + cell;
        var pts = {
          tl: [x0, y0, x1, y0, x0, y1],
          tr: [x0, y0, x1, y0, x1, y1],
          bl: [x0, y0, x0, y1, x1, y1],
          br: [x1, y0, x1, y1, x0, y1],
        }[corner || 'bl'];
        var poly = svg('polygon', { points: pts.join(' '), class: cls || 'cell-fill' });
        under.appendChild(poly);
        return poly;
      },
    };
    return g;
  };

  /**
   * A centimetre ruler drawn in SVG, as a <g> you can position and drag.
   * var r = ui.ruler({ from: 0, to: 15, cm: 40 });   // cm = pixels per centimetre
   * r.g       – the <g> element (place with r.moveTo(x, y))
   * r.width   – pixel width of the ruler body
   * r.xOf(n)  – x offset (inside the ruler) of the tick for number n
   * Numbers are drawn above every whole cm; half-cm ticks are shorter.
   */
  ui.ruler = function (opts) {
    var from = opts.from == null ? 0 : opts.from;
    var to = opts.to == null ? 15 : opts.to;
    var cm = opts.cm || 40;
    var lead = opts.lead == null ? 14 : opts.lead; // blank space before the first tick
    var height = opts.height || 56;
    var width = (to - from) * cm + lead * 2;
    var g = svg('g', { class: 'ruler' + (opts.broken ? ' ruler-broken' : '') });
    g.appendChild(svg('rect', { x: 0, y: 0, width: width, height: height, rx: 6, class: 'ruler-body' }));
    for (var n = from; n <= to; n++) {
      var x = lead + (n - from) * cm;
      g.appendChild(svg('line', { x1: x, y1: 0, x2: x, y2: 22, class: 'ruler-tick' }));
      g.appendChild(svg('text', { x: x, y: 40, class: 'ruler-num', 'text-anchor': 'middle' }, String(n)));
      if (n < to) {
        var xh = x + cm / 2;
        g.appendChild(svg('line', { x1: xh, y1: 0, x2: xh, y2: 13, class: 'ruler-tick ruler-tick-half' }));
        if (cm >= 30) {
          for (var mm = 1; mm < 10; mm++) {
            if (mm === 5) continue;
            var xm = x + (cm * mm) / 10;
            g.appendChild(svg('line', { x1: xm, y1: 0, x2: xm, y2: 7, class: 'ruler-tick ruler-tick-mm' }));
          }
        }
      }
    }
    if (opts.label !== false) g.appendChild(svg('text', { x: width - 8, y: height - 6, class: 'ruler-cm', 'text-anchor': 'end' }, 'cm'));
    var api = {
      g: g,
      width: width,
      height: height,
      cm: cm,
      lead: lead,
      from: from,
      to: to,
      x: 0,
      y: 0,
      xOf: function (num) {
        return lead + (num - from) * cm;
      },
      moveTo: function (x, y) {
        api.x = x;
        api.y = y;
        g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      },
    };
    return api;
  };

  /**
   * A row of cards to show a fact or a working-out, e.g. ui.sum([3, 3, 3, 3], 12, 'cm')
   * renders "3 + 3 + 3 + 3 = 12 cm" with each part in a chip.
   */
  ui.sum = function (parts, total, unit) {
    var row = el('div', { class: 'sum-row' });
    parts.forEach(function (p, i) {
      if (i) row.appendChild(el('span', { class: 'sum-op' }, '+'));
      row.appendChild(el('span', { class: 'chip' }, MQ.util.fmt(p)));
    });
    if (total != null) {
      row.appendChild(el('span', { class: 'sum-op' }, '='));
      row.appendChild(el('span', { class: 'chip chip-total' }, MQ.util.fmt(total) + (unit ? ' ' + unit : '')));
    }
    return row;
  };

  /** A heading + text block for teaching screens. */
  ui.lesson = function (title, body) {
    return el('div', { class: 'lesson' }, title ? el('h2', { class: 'lesson-title' }, title) : null, body ? el('p', { class: 'lesson-text', html: body }) : null);
  };

  /** A question prompt in large text. html allowed. */
  ui.prompt = function (html) {
    return el('div', { class: 'prompt', html: html });
  };

  /** Simple confetti burst over the page (used by the app on finish). */
  ui.confetti = function (host) {
    host = host || document.body;
    var colors = ['#ffb703', '#2ec4b6', '#ff6b6b', '#8ecae6', '#c77dff', '#90be6d'];
    var layer = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (var i = 0; i < 60; i++) {
      layer.appendChild(
        el('i', {
          style: {
            left: Math.random() * 100 + '%',
            background: colors[i % colors.length],
            animationDelay: Math.random() * 0.6 + 's',
            animationDuration: 1.6 + Math.random() * 1.4 + 's',
            transform: 'rotate(' + Math.random() * 360 + 'deg)',
          },
        })
      );
    }
    host.appendChild(layer);
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 3500);
  };
})();
