const iconMap = {
  food: { text: '🍽️', color: '#FF6B6B', svg: 'food' },
  transport: { text: '🚗', color: '#38C172', svg: 'transport' },
  hotel: { text: '🏨', color: '#4A90D9', svg: 'hotel' },
  entertainment: { text: '🎮', color: '#FFD93D', svg: 'entertainment', stroke: '#D99A00' },
  ticket: { text: '🎫', color: '#6C5CE7', svg: 'ticket' },
  shopping: { text: '🛍️', color: '#FF8C42', svg: 'shopping' },
  other: { text: '📦', color: '#999999', svg: 'other' },
  diamond: { text: '💎', color: '#38C172' },
  setting: { text: '⚙️', color: '#666' },
  back: { text: '←', color: '#333' },
  location: { text: '📍', color: '#38C172' },
  member: { text: '👤', color: '#4A90D9' },
  plus: { text: '+', color: '#fff' },
  write: { text: '✏️', color: '#fff' },
  share: { text: '📤', color: '#666' },
  feedback: { text: '💬', color: '#666' },
  export: { text: '📊', color: '#666' },
  ticket_stub: { text: '🎟️', color: '#FF8C42' },
  schedule: { text: '📋', color: '#38C172' },
  bill: { text: '💰', color: '#FF6B6B' },
  statistics: { text: '📈', color: '#4A90D9' }
};

Component({
  properties: {
    icon: {
      type: String,
      value: 'other'
    },
    size: {
      type: Number,
      value: 64
    },
    round: {
      type: Boolean,
      value: false
    }
  },

  data: {
    iconText: '',
    svgName: '',
    svgColor: '#999999',
    iconSize: 36,
    bgColor: '#EEEEEE'
  },

  lifetimes: {
    attached() {
      this.updateIcon();
    }
  },

  observers: {
    'icon, size'() {
      this.updateIcon();
    }
  },

  methods: {
    updateIcon() {
      const icon = this.data.icon;
      const info = iconMap[icon];
      if (info) {
        this.setData({
          iconText: info.text,
          svgName: info.svg || '',
          svgColor: info.stroke || info.color,
          iconSize: Math.round(this.data.size * 0.56),
          bgColor: info.color + '20'
        });
        return;
      }
      // 不在映射表中的值视为自定义 emoji（「其他」分类可更换图标），直接展示
      const fallback = iconMap['other'];
      this.setData({
        iconText: icon || fallback.text,
        svgName: '',
        bgColor: fallback.color + '20'
      });
    }
  }
});
