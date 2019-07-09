import Vue from 'vue'
// (1) 导入组件
// import Vuex from 'vuex'
import Vuex from './vuex.js'
// (2) 引入插件
Vue.use(Vuex)
//(3) 导出实例
// 这里为什么不能出现this？
export default new Vuex.Store({
    modules: { // 给状态划分模块
        a: {
            state: {
                count: 200,
            },
            mutations: {
                change(state) {
                    console.log('------');
                }
            },
            modules: {
                b: {
                    state: {
                        count: 3000
                    }
                },
                c: {
                    state: {
                        count: 4000
                    }
                }
            }
        }
    },
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
            console.log('xxxxxxx');
            state.count += 100;
        }
    },
    actions: {
        change({commit}) {
            setTimeout(() => {
                console.log('thisafasfa', this);
                this.commit('change');
            }, 1000)
        }
    },
})