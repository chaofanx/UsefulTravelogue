const iconMap = {
  food: { text: '🍽️', color: '#FF6B6B' },
  transport: { text: '🚗', color: '#38C172' },
  hotel: { text: '🏨', color: '#4A90D9' },
  entertainment: { text: '🎮', color: '#FFD93D' },
  ticket: { text: '🎫', color: '#6C5CE7' },
  shopping: { text: '🛍️', color: '#FF8C42' },
  other: { text: '📦', color: '#999' },
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
    bgColor: '#EEEEEE'
  },

  lifetimes: {
    attached() {
      this.updateIcon();
    }
  },

  observers: {
    'icon'() {
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
          bgColor: info.color + '20'
        });
        return;
      }
      // 不在映射表中的值视为自定义 emoji（「其他」分类可更换图标），直接展示
      const fallback = iconMap['other'];
      this.setData({
        iconText: icon || fallback.text,
        bgColor: fallback.color + '20'
      });
    }
  }
});
