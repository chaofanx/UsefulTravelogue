const { getCapsuleInfo } = require('../../utils/capsule');

Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    leftArrow: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 44,
    capsuleLeft: 200
  },

  lifetimes: {
    attached() {
      const info = getCapsuleInfo();
      this.setData({
        statusBarHeight: info.statusBarHeight,
        capsuleLeft: info.capsuleLeft
      });
    }
  },

  methods: {
    onBack() {
      this.triggerEvent('back');
    }
  }
});
