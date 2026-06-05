const echarts = require('./echarts');

let idIndex = 0;

function wrapTouch(evt) {
  for (let i = 0, len = evt.touches.length; i < len; ++i) {
    const touch = evt.touches[i];
    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }
  return evt;
}

function getNodeId() {
  idIndex += 1;
  return `ec-${idIndex}`;
}

Component({
  properties: {
    canvasId: {
      type: String,
      value: ''
    },
    ec: {
      type: Object,
      value: {}
    },
    width: {
      type: Number,
      value: 400
    },
    height: {
      type: Number,
      value: 400
    },
    disableTouch: {
      type: Boolean,
      value: false
    }
  },

  lifetimes: {
    attached() {
      const canvasId = this.data.canvasId || getNodeId();
      this.setData({ canvasId });

      this.ecComponent = this;

      const touchEvents = this.data.disableTouch ? {} : {
        touchStart: (e) => {
          if (this.chart && e.touches.length > 0) {
            const touch = e.touches[0];
            const handler = this.chart.getZr().handler;
            handler.dispatch('mousedown', {
              zrX: touch.x,
              zrY: touch.y,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {}
            });
            handler.dispatch('mousemove', {
              zrX: touch.x,
              zrY: touch.y,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {}
            });
            handler.processGesture(wrapTouch(e), 'start');
          }
        },
        touchMove: (e) => {
          if (this.chart && e.touches.length > 0) {
            const touch = e.touches[0];
            const handler = this.chart.getZr().handler;
            handler.dispatch('mousemove', {
              zrX: touch.x,
              zrY: touch.y,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {}
            });
            handler.processGesture(wrapTouch(e), 'change');
          }
        },
        touchEnd: (e) => {
          if (this.chart) {
            const touch = e.changedTouches ? e.changedTouches[0] : {};
            const handler = this.chart.getZr().handler;
            handler.dispatch('mouseup', {
              zrX: touch.x,
              zrY: touch.y,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {}
            });
            handler.dispatch('click', {
              zrX: touch.x,
              zrY: touch.y,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {}
            });
            handler.processGesture(wrapTouch(e), 'end');
          }
        }
      };

      this.setData({ ec: { ...touchEvents, onInit: this.data.ec.onInit } });
    },

    ready() {
      if (!this.data.ec) {
        console.warn('ec-canvas: ec property is required for ECharts initialization');
        return;
      }

      if (!this.data.ec.lazyLoad) {
        this.init();
      }
    },

    detached() {
      this.ecComponent = null;
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    }
  },

  methods: {
    init(callback) {
      const query = wx.createSelectorQuery().in(this);
      query
        .select(`#ec-canvas-${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            setTimeout(() => this.init(callback), 50);
            return;
          }

          const canvasNode = res[0].node;
          const ctx = canvasNode.getContext('2d');

          const dpr = wx.getSystemInfoSync().pixelRatio || 2;
          canvasNode.width = res[0].width * dpr;
          canvasNode.height = res[0].height * dpr;

          const options = {
            width: res[0].width,
            height: res[0].height,
            devicePixelRatio: dpr
          };

          echarts.setCanvasCreator(() => canvasNode);

          if (typeof callback === 'function') {
            this.chart = callback(canvasNode, res[0].width, res[0].height, dpr);
          } else if (typeof this.data.ec.onInit === 'function') {
            this.chart = this.data.ec.onInit(canvasNode, res[0].width, res[0].height, dpr);
          }

          this.triggerEvent('init', { chart: this.chart });
        });
    },

    canvasToTempFilePath(args = {}) {
      const query = wx.createSelectorQuery().in(this);
      query
        .select(`#ec-canvas-${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvasNode = res[0].node;
          args.canvas = canvasNode;
          wx.canvasToTempFilePath(args);
        });
    },

    getChart() {
      return this.chart;
    }
  }
});
