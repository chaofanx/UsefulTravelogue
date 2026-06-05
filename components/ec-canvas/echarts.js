var echarts = (function() {
  var instances = {};
  var canvasCreator;

  function setCanvasCreator(fn) {
    canvasCreator = fn;
  }

  function init(canvas, theme, opts) {
    opts = opts || {};
    var width = opts.width || 300;
    var height = opts.height || 300;
    var dpr = opts.devicePixelRatio || 2;

    var instance = {
      _canvas: canvas,
      _width: width,
      _height: height,
      _dpr: dpr,
      _option: null,
      _disposed: false,

      setOption: function(option) {
        this._option = option;
        this._render();
      },

      _render: function() {
        var ctx = canvas.getContext('2d');
        var w = this._width;
        var h = this._height;
        var dpr = this._dpr;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.clearRect(0, 0, w * dpr, h * dpr);
        ctx.scale(dpr, dpr);

        var series = this._option && this._option.series;
        if (!series || !series.length) return;

        var s = series[0];
        if (s.type === 'pie') {
          this._renderPie(ctx, w, h, s);
        }
      },

      _renderPie: function(ctx, w, h, series) {
        var data = series.data || [];
        var radius = series.radius;
        var center = series.center || ['50%', '50%'];

        var cx, cy, outerRadius, innerRadius;

        if (typeof radius === 'string') {
          var r = parseFloat(radius) / 100;
          outerRadius = Math.min(w, h) / 2 * r;
        } else if (Array.isArray(radius)) {
          innerRadius = Math.min(w, h) / 2 * (parseFloat(radius[0]) / 100);
          outerRadius = Math.min(w, h) / 2 * (parseFloat(radius[1]) / 100);
        } else {
          outerRadius = Math.min(w, h) / 2 * 0.7;
        }

        cx = w * (parseFloat(center[0]) / 100);
        cy = h * (parseFloat(center[1]) / 100);

        var total = data.reduce(function(sum, item) { return sum + (item.value || 0); }, 0);
        if (total === 0) return;

        var startAngle = -Math.PI / 2;
        var colors = series.color || ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#00BCD4', '#999'];

        data.forEach(function(item, i) {
          var angle = (item.value / total) * Math.PI * 2;
          var color = item.itemStyle && item.itemStyle.color ? item.itemStyle.color : colors[i % colors.length];

          if (innerRadius) {
            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, startAngle, startAngle + angle);
            ctx.arc(cx, cy, innerRadius, startAngle + angle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, (outerRadius + innerRadius) / 2, startAngle + angle / 2, startAngle + angle / 2 + 0.01);
            ctx.lineWidth = (outerRadius - innerRadius);
            ctx.strokeStyle = color;
            ctx.lineCap = 'butt';
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerRadius, startAngle, startAngle + angle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
          }

          startAngle += angle;
        });

        if (innerRadius) {
          ctx.beginPath();
          ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      },

      resize: function(opts) {
        if (opts) {
          this._width = opts.width || this._width;
          this._height = opts.height || this._height;
        }
        this._render();
      },

      dispose: function() {
        this._disposed = true;
      },

      getZr: function() {
        return {
          handler: {
            dispatch: function() {},
            processGesture: function() {}
          }
        };
      },

      clear: function() {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, this._width * this._dpr, this._height * this._dpr);
      }
    };

    var id = 'ec_' + Math.random().toString(36).substr(2, 9);
    instances[id] = instance;
    return instance;
  }

  function getInstanceByDom() {
    return null;
  }

  function registerTheme() {}

  return {
    init: init,
    setCanvasCreator: setCanvasCreator,
    getInstanceByDom: getInstanceByDom,
    registerTheme: registerTheme
  };
})();

module.exports = echarts;
