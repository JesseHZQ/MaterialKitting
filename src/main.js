// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import vueResource from 'vue-resource'
Vue.use(vueResource)
import iView from 'iview'
Vue.use(iView)
import moment from 'moment'//导入文件
Vue.prototype.$moment = moment;//赋值使用

// post跨域
Vue.http.options.emulateJSON = true;
Vue.http.options.xhr = { withCredentials: true }
Vue.http.options.crossOrigin = true
Vue.http.options.emulateHTTP = true

// 引入iview的样式文件
import 'iview/dist/styles/iview.css'

// 引入自己的基础样式文件
import './assets/css/base.css'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
