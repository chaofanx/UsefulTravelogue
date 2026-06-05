const DEFAULT_COLORS = ['#4A90D9', '#FF6B6B', '#38C172', '#FFD93D', '#6C5CE7', '#FF8C42', '#00BCD4', '#999'];

Component({
  properties: {
    data: {
      type: Array,
      value: []
    },
    width: {
      type: Number,
      value: 400
    },
    height: {
      type: Number,
      value: 400
    },
    lineWidth: {
      type: Number,
      value: 24
    },
    colors: {
      type: Array,
      value: []
    },
    centerText: {
      type: String,
      value: ''
    },
    centerSub: {
      type: String,
      value: ''
    }
  },

  data: {
    _ready: false
  },

  observers: {
    'data'(val) {
      if (val && val.length > 0 && this.data._ready) {
        this.drawChart();
      }
    }
  },

  lifetimes: {
    attached() {
      this.data._ready = true;
      setTimeout(() => this.drawChart(), 200);
    }
  },

  methods: {
    drawChart() {
      const query = this.createSelectorQuery();
      query.select('#ring-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio || 2;
          const w = res[0].width;
          const h = res[0].height;

          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);

          this.renderRing(ctx, w, h);
        });
    },

    renderRing(ctx, w, h) {
      const data = this.data.data;
      if (!data || data.length === 0) return;

      const colors = this.data.colors.length > 0 ? this.data.colors : DEFAULT_COLORS;
      const lineWidth = this.data.lineWidth;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) / 2 - lineWidth;

      const total = data.reduce((sum, item) => sum + item.value, 0);
      if (total === 0) return;

      ctx.clearRect(0, 0, w, h);

      let startAngle = -Math.PI / 2;

      data.forEach((item, index) => {
        const angle = (item.value / total) * Math.PI * 2;
        const color = item.color || colors[index % colors.length];

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();

        startAngle += angle;
      });

      // Draw inner shadow effect
      ctx.beginPath();
      ctx.arc(cx, cy, radius - lineWidth / 2, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius + lineWidth / 2, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.stroke();
    }
  }
});
