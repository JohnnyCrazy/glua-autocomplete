var provider = require('./provider');
var CompositeDisposable = require('atom').CompositeDisposable;

module.exports = {
    provide: function() {
        return provider;
    },

    activate: function() {
        provider.activate()
    },
};
