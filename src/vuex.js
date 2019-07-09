
let Vue;

class ModuleCollection {
    constructor(options) { // vuex [a, b] // 根模块里面有一个a模块，a模块有一个b模块
        this.register([], options);
    }
    register(path, rawModule) {
        // path是个空数组，rawModule是一个对象
        let newModule = {
            _raw: rawModule, // 对象 当前有state，getters那个对象
            _children: {},
            state: rawModule.state // 自己模块的状态
        };

        if (path.length === 0) {
            this.root = newModule; // 根
        } else {
            let parent = path.slice(0, -1).reduce((root, current) => {
                return root._children[current];
            }, this.root);
            parent._children[path[path.length - 1]] = newModule;
        }
        if (rawModule.modules) { // 有子模块
            forEach(rawModule.modules, (childName, module) => {
                this.register(path.concat(childName), module);
            }); 
        }
    }
}

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
        
        // 模块之间的关系进行整理 root._children => a._children => b
        this.modules = new ModuleCollection(options);
        console.log('this.modules', this.modules);
        // 无论是子模块还是孙子模块，所有的mutation都是根上的，公用的

        // this是store的实例, []为path, this.modules.root当前的根模块
        installModule(this, state, [], this.modules.root);

        // 下面的只适用于根模块
        // if (options.getters) {
        //     let getters = options.getters; // {newCount: fn}
        //     forEach(getters, (getterName, getterFn) => {
        //         // 类似计算属性
        //         Object.defineProperty(this.getters, getterName, { // 这里一定要用this.getters ?
        //             get: () => {
        //                 return getterFn(state);
        //             }
        //         });
        //     });
        // }
        
        // if (options.mutations) {
        //     let mutations = options.mutations;
        //     forEach(mutations, (mutationName, mutationFn) => {
        //         // this.mutations[mutationName] = mutationFn; // 这样写函数的this不确定
        //         this.mutations[mutationName] = () => {
        //             mutationFn.call(this, state);
        //         };
        //     })
        // }

        // if (options.actions) {
        //     let actions = options.actions;
        //     forEach(actions, (actionName, actionFn) => {
        //         // this.mutations[mutationName] = mutationFn; // 这样写函数的this不确定
        //         this.actions[actionName] = () => {
        //             actionFn.call(this, this);
        //         };
        //     })
        // }

        // 如果不加下面这段，this会报错。 先将commit保存下来，然后再调用。 先调用实例本身的commit方法，然后再调用原型的方法
        // let { commit, dispatch } = this;
        // this.commit = (type) => {
        //     commit.call(this, type);
        // };
        // this.dispatch = (type) => {
        //     dispatch.call(this, type);
        // };
    }
    get state() { // Object.defineProperty get一样
        // return this.state;
        return this._vm.state;
    }
    commit(type) {
        console.log('this', this);
        this.mutations[type].forEach(fn => fn());
    }
    dispatch(type) {
        this.actions[type].forEach(fn => fn());
    }
}

function installModule(store, rootState, path, rootModule) {
    // rootState.a = {count: 100};
    // rootState.a.b = {count: 200};
    // 这里循环获取state各个级别
    if (path.length > 0) {
        let parent = path.slice(0, -1).reduce((root, current) => {
            return root[current];
        }, rootState);

        // 响应式 
        Vue.set(parent, path[path.length-1], rootModule.state);
    }

    if (rootModule._raw.getters) {
        forEach(rootModule._raw.getters, (getterName, getterFn) => {
            Object.defineProperty(store.getters, getterName, {
                get: () => {
                    return getterFn(rootModule.state);
                }
            })
        })
    }

    if (rootModule._raw.actions) {
        forEach(rootModule._raw.actions, (actionName, actionFn) => {
            let entry = store.actions[actionName] || (store.actions[actionName] = []);
            entry.push(() => {
                actionFn.call(store, store)
            });
        })
    }

    if (rootModule._raw.mutations) {
        forEach(rootModule._raw.mutations, (mutationName, mutationFn) => {
            let entry = store.mutations[mutationName] || (store.mutations[mutationName] = []);
            entry.push(() => {
                mutationFn.call(store, rootModule.state)
            });
        })
    }
    forEach(rootModule._children, (childName, module) => {
        installModule(store, rootState, path.concat(childName), module);
    });
}

// 遍历对象，Object.keys或者for in
function forEach(obj, callback) {
    Object.keys(obj).forEach(item => callback(item, obj[item]));
}

export default {
    Store,
    install,
}