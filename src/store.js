import Vue from 'vue'
// (1) 导入组件
// import Vuex from 'vuex'
import Vuex from './vuex.js'
// (2) 引入插件
Vue.use(Vuex)
//(3) 导出实例
export default new Vuex.Store({
    state: {
        count: 100,
    },
    getters: { // 类似于computed
        newCount(state) {
            return state.count + 100;
        }
    },
    mutations: {
        change(state) {
            state.count += 100;
        }
    },
    actions: {
        change({commit}) {
            setTimeout(() => {
                commit('change');
            }, 1000)
        }
    },
})