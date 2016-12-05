var postcss = require('postcss'),
    resolvedNestedSelector = require('postcss-resolve-nested-selector'),
    assign = require('object-assign'),
    escRgx = require('escape-string-regexp');

module.exports = postcss.plugin('postcss-nested-ancestors', function (opts) {
    opts = assign({
        placeholder: '^&',
        replaceDeclarations: false
    }, opts);

    // Advanced options
    opts = assign({
        levelSymbol: opts.levelSymbol || opts.placeholder.charAt(0),
        parentSymbol: opts.parentSymbol || opts.placeholder.charAt(1)
    }, opts);

        // Get all ancestors placeholder recurrencies: ^&, ^^&, ^^^&, [...]
    var placeholderRegex = new RegExp(
            // eslint-disable-next-line max-len
            '(' + escRgx(opts.levelSymbol) + ')+(' + escRgx(opts.parentSymbol) + ')',
            'g'
        );

    /**
     * Climb up PostCSS node parent stack
     * @param  {Object} node            PostCSS node object
     * @param  {Number} nestingLevel    Number of parent to climb
     * @return {Object|false}           Parent PostCSS node or false if no matching parent
     */
    function getParentNodeAtLevel(node, nestingLevel) {
        var i,
            currentNode = node;
        nestingLevel = nestingLevel || 1;

        for (i = 0; i < nestingLevel; i++) {
            if (currentNode.parent) {
                currentNode = currentNode.parent;
            } else {
                currentNode = false;
                break;
            }
        }
        return currentNode;
    }

    /**
     * Given a PostCSS object and the level of a parent rule,
     * return the selector of the matching parent rule
     *
     * @param  {Object} rule            PostCSS Rule object
     * @param  {Number} nestingLevel    Ancestor nesting depth (0 = &, 1 = ^&, ...)
     * @param  {Object} result          PostCSS Result object
     * @return {Array}                  Array of ancestor selectors
     */
    function getParentSelectorsAtLevel(rule, nestingLevel, result) {
        nestingLevel = nestingLevel || 1;

        // Get parent PostCSS rule object at requested nesting level
        var parentNodeAtLevel = getParentNodeAtLevel(rule, nestingLevel + 1);

        if (parentNodeAtLevel && parentNodeAtLevel.selectors) {
            return resolvedNestedSelector(parentNodeAtLevel.selector, parentNodeAtLevel);
        } else {
            // Set a warning no matching parent node found
            rule.warn(result, 'Parent selector exceeds current stack.');
            return [''];
        }
    }

    /**
     * Given an ancestor placeholder and the PostCSS node object,
     * returns the corresponding parent selectors
     * calculated from the provided PostCSS node object.
     *
     * @param  {String} placeholder     Ancestor placeholder (eg.^^&)
     * @param  {Object} rule            PostCSS Rule/Node object
     * @param  {Object} result          PostCSS Result object
     * @return {Array}                  Array of ancestor selectors
     */
    function getMatchingParentSelectors(placeholder, rule, result) {
        return getParentSelectorsAtLevel(
            rule,
            // Get how many level symbols ("^") has current placeholder
            placeholder.lastIndexOf(opts.levelSymbol) / opts.levelSymbol.length  + 1,
            result
        );
    }

    /**
     * Given a selector string and its PostCSS node object,
     * return a string rapresenting the provided selector
     * with ancestor placeholder replaced with actual parent selectors
     *
     * @param  {Array} selectors    Array of CSS selector / string
     * @param  {Object} rule        a PostCSS Rule/Node object
     * @param  {Object} result      a PostCSS Result object
     * @return {String}             Array of Arrays of CSS selectors
     */
    function replacePlaceholders(selectors, rule, result) {
        const resolvedSelectors = selectors.map(function (selector) {
            // Look for an ancestor placeholder into selector (eg. ^^&-foo)
            const placeholder = selector.match(placeholderRegex);

            // Ancestor placeholder found (eg. ^^&):
            if (placeholder) {
                // Get the array of parent selectors matching current placeholder
                // (eg. ['.ancestor-1, '.ancestor-2'])
                const parentSelectors = getMatchingParentSelectors(placeholder[0], rule, result);

                // For any parent selector found, return a new selector
                // by merging current selector and matching parent selectors
                // (eg. ['.ancestor-1-foo, '.ancestor-2-foo'])
                return parentSelectors.map(function (parentSelector) {
                    return selector.replace(placeholder[0], parentSelector);
                });
            }

            return selector;
        });

        return resolvedSelectors;
    }

    var process = function (node, result) {
        node.each( function (rule) {
            if (rule.type === 'rule') {

                // Replace parents placeholders in each rule selector
                rule.selectors = replacePlaceholders(rule.selectors, rule, result);

                // Process child rules
                process(rule, result);
            }

            // Optionally replace parents placeholders into declarations
            // eslint-disable-next-line brace-style
            else if (opts.replaceDeclarations && rule.type === 'decl') {
                rule.values = replacePlaceholders(rule.value, rule, result);
                rule.props = replacePlaceholders(rule.prop, rule, result);
            }
        });
    };

    return function (root, result) {
        process(root, result);
    };
});
