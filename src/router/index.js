import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/home'
import TE from '@/components/TE'
import MC from '@/components/MC'
import MCOP from '@/components/MCOP'

Vue.use(Router)

export default new Router({
  routes: [
    // {
    //   path: '/',
    //   name: 'home',
    //   component: Home
    // },
    {
      path: '/',
      name: 'TE',
      component: TE
    },
    {
      path: '/te',
      name: 'home',
      component: Home
    },
    {
      path: '/mc',
      name: 'MC',
      component: MC
    },
    {
      path: '/mcop',
      name: 'MCOP',
      component: MCOP
    }
  ]
})
