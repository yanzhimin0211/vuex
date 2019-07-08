let Vue;
let install = (_Vue) => {
    console.log(_Vue, 'install');
    Vue = _Vue; // 保留Vue的构造函数
    // 给每个组件添加$store对象
    Vue.mixin({
        beforeCreate() {
            // 把根组件中的store实例, 给每个组件增加一个$store
            console.log('beforeCreate');
            // 是否是根组件
            if (this.$options && this.$options.store) { // 根组件
                this.$store = this.$options.store;
            } else { // 子组件 深度优先 父 --》子 --》孙
                this.$store = this.$parent && this.$parent.$store;
            }
        },
    })
}

class Store {
    constructor(options) {
        //  this.state = options.state; 无法实现双向绑定
        //  有get和set的属性可以实现双向绑定 new vue({data: {}})
        let state = options.state;
        this.getters = {};
        this.mutations = {};
        this.actions = {};
        // vuex 的核心就是借用了vue的实例，因为vue的实例数据变化，会刷新视图
        this._vm = new Vue({
            data: {
                state
            }
        });

        if (options.getters) {
            let getters = options.getters; // {newCount: fn}
            forEach(getters, (getterName, getterFn) => {
                // 类似计算属性
                Object.defineProperty(this.getters, getterName, { // 这里一定要用this.getters ?
                    get: () => {
                        return getterFn(state);
                    }
                });
            });
        }
        
        if (options.mutations) {
            let mutations = options.mutations;
            forEach(mutations, (mutationName, mutationFn) => {
                // this.mutations[mutationName] = mutationFn; // 这样写函数的this不确定
                this.mutations[mutationName] = () => {
                    mutationFn.call(this, state);
                };
            })
        }

        if (options.actions) {
            let actions = options.actions;
            forEach(actions, (actionName, actionFn) => {
                // this.mutations[mutationName] = mutationFn; // 这样写函数的this不确定
                this.actions[actionName] = () => {
                    actionFn.call(this, this);
                };
            })
        }

        // 如果不加下面这段，this会报错。 先将commit保存下来，然后再调用。 先调用实例本身的commit方法，然后再调用原型的方法
        let { commit, dispatch } = this;
        this.commit = (type) => {
            commit.call(this, type);
        };
        this.dispatch = (type) => {
            dispatch.call(this, type);
        };
    }
    get state() { // Object.defineProperty get一样
        // return this.state;
        return this._vm.state;
    }
    commit(type) {
        console.log('this', this);
        this.mutations[type]();
    }
    dispatch(type) {
        this.actions[type]();
    }
}

// 遍历对象，Object.keys或者for in
function forEach(obj, callback) {
    Object.keys(obj).forEach(item => callback(item, obj[item]));
}

export default {
    Store,
    install,
}