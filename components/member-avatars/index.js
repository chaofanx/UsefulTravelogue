const { getAvatarText } = require('../../utils/util');

Component({
  properties: {
    members: {
      type: Array,
      value: []
    },
    maxShow: {
      type: Number,
      value: 3
    }
  },

  data: {
    displayMembers: [],
    extraCount: 0
  },

  observers: {
    'members'(members) {
      if (!members || !members.length) {
        this.setData({ displayMembers: [], extraCount: 0 });
        return;
      }
      const display = members.slice(0, this.data.maxShow).map(m => ({
        ...m,
        firstChar: getAvatarText(m.name)
      }));
      const extra = Math.max(0, members.length - this.data.maxShow);
      this.setData({
        displayMembers: display,
        extraCount: extra
      });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap');
    }
  }
});
