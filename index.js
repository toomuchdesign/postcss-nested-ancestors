var postcss = require('postcss'),
    assign = require('object-assign'),
    escRgx = require('escape-string-regexp');

module.exports = postcss.plugin('postcss-nested-ancestors', function (opts) {
    opts = assign({
        placeholder: '^&'
    }, opts);

    // Advanced options
    opts = assign({
        levelSymbol: opts.levelSymbol || opts.placeholder.charAt(0),
        parentSymbol: opts.parentSymbol || opts.placeholder.charAt(1)
    }, opts);

    var parentsStack = [],
        placeholderRegex = new RegExp(
            /**
             * Get all ancestors placeholder recurrencies:
             * ^&, ^^&, ^^^&, [...]
             */
            // eslint-disable-next-line max-len
            '(' + escRgx(opts.levelSymbol) + ')+(' + escRgx(opts.parentSymbol) + ')',
            'g'
        );

    /**
     * Walk current ancestor stack and
     * assembly ancestor selector at the given depth.
     *
     * @param  {Number} ancestor nesting depth ( 0 = &, 1 = grandparent, ...)
     * @return {String} ancestor selector
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

    /**
     * Given an ancestor placeholder,
     * returns the corresponding selector fragment.
     * Used as replacer in .replace method
     *
     * @param  {String} placeholder eg.^^&
     * @return {String} string      ancestor selector fragment
     */
    function placeholderReplacer(placeholder) {
        return getParentSelectorAtLevel(
            // Get how many level symbols ("^") has current placeholder
            placeholder.split(opts.levelSymbol).length - 1
        );
    }

    /**
     * Replace any ancestor placeholder into a given selector.
     *
     * @param  {String} selector
     * @return {String} selector
     */
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
                if (rule.parent.type === 'rule') {
                    parentsStack.push(rule.parent.selector);
                }

                // Replace parents placeholders in rule selector
                rule.selectors = rule.selectors.map(replacePlaceholders);

                // Process child rules
                process(rule);
            }

        });
        // Remove current parent stack item at the end of each child iteration
        parentsStack.pop();
    };
    return process;
});
