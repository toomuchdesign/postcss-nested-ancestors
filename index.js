var postcss = require('postcss');

module.exports = postcss.plugin('postcss-nested-grandpa', function (opts) {
    opts = opts || {};
    opts.placeholder = opts.placeholder || '%';

    var parentsStack = [],
        placeholderRegex = new RegExp(opts.placeholder, 'g');

    function makeGrandpa() {
        return parentsStack.filter( function (rule, index) {
            return index < parentsStack.length - 1;
        })
            .join(' ')
            .replace(/\s&/g, '');
    }

    var process = function (node) {
        node.each( function (rule) {

            if (rule.type === 'rule') {

                // Add current parent selector to current parent stack
                if (rule.parent.selector) {
                    parentsStack.push(rule.parent.selector);
                }

                // console.log('rule.selector', rule.selector);
                // console.log('parentsStack', parentsStack);
                // console.log('makeGrandpa', makeGrandpa());
                // console.log('-----');

                rule.selector = rule.selector.replace(
                    placeholderRegex, makeGrandpa()
                );

                process(rule);
            }

        });
        // Remove current parent stack item at the end of each child iteration
        parentsStack.pop();
    };
    return process;
});


