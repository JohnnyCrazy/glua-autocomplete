var provider = require('./provider');
var CompositeDisposable = require('atom').CompositeDisposable;

module.exports = {
    provide: function() {
        return provider;
    },

    activate: function() {
        provider.activate()
        this.subscriptions = new CompositeDisposable;
        return this.subscriptions.add(atom.commands.add('atom-workspace', {
            'glua-autocomplete:toggle': (function(_this) {
                return function() {
                    return _this.toggle();
                };
            })(this)
        }));
    },

    toggle: function() {

    }
};
