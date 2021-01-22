Vue.component('ColoredBox', {
  template: "<div class=\"box\"><button v-on:click=\"toggleMe()\">Toggle Now</button></div>",
  methods: {
    toggleMe() {
      this.$root.toggleBox()
    }
  }
})
const vueApp = new Vue({
  el: '#vapp',
  data: { 
   display: 'redbox' 
  },
  methods: {
    toggleBox() {
      this.display == 'redbox' ? this.display = 'greenbox' : this.display = 'redbox'
    }
  }
})