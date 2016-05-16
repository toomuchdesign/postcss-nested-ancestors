var postcss = require('postcss'),
    assign = require('object-assign'),
    escpRegex = require('escape-string-regexp');

module.exports = postcss.plugin('postcss-nested-ancestors', function (opts) {
    opts = assign({
        placeholder: '^&'
    }, opts);

    // Advanced options
    opts = assign({
        levelSymbol: opts.placeholder.charAt(0),   /* default "^" */
        parentSymbol: opts.placeholder.charAt(1)   /* default "&" */
    }, opts);

    var parentsStack = [],
        placeholderRegex = new RegExp(
            /*
             * Get all parent placeholder recurrencies:
             * ^&, ^^&, ^^^&, [...]
             *
             * default regex: "^+&"
             */
            escpRegex(opts.levelSymbol) + '+' + escpRegex(opts.parentSymbol),
            'g'
        );

    /*
     * getParentSelectorAtLevel()
     *
     * Assemble current parent selector.
     *
     * nestingLevel param make it possible to select
     * an higher parent up into parents hierarchy
     *
     * eg.
     * nestingLevel = 0 is direct parent (same of "&")
     * nestingLevel = 1 is grandparent
     * ...
     */
    function getParentSelectorAtLevel(nestingLevel) {
        nestingLevel = nestingLevel || 1;

        // @TODO add warning when nestingLevel >= parentsStack.length

        return parentsStack.filter( function (rule, index) {
            return index < parentsStack.length - nestingLevel;
        })
            .join(' ')
            .replace(/\s&/g, '');   // Remove empty spaces before "&"
    }

    function placeholderReplacer(placeholder) {
        return getParentSelectorAtLevel(
            // Get how many levels ("^") has current placeholder
            placeholder.split(opts.levelSymbol).length - 1
        );
    }

    function replacePlaceholders(selector) {
        // Find placeholders and replace them with matching parent selector
        return selector.replace(
            placeholderRegex,
            placeholderReplacer
        );
    }

    var process = function (node) {
        node.each( function (rule) {

            if (rule.type === 'rule') {

                // Add current parent selector to current parent stack
                if (rule.parent.selector) {
                    parentsStack.push(rule.parent.selector);
                }

                // Replace parents placeholders in rule selctor
                rule.selectors = rule.selectors.map(replacePlaceholders);
                process(rule);
            }

        });
        // Remove current parent stack item at the end of each child iteration
        parentsStack.pop();
    };
    return process;
});


