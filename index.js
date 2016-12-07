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
     * @param  {Object} node            PostCSS Node object
     * @param  {Number} nestingLevel    Ancestor nesting depth (0 = &, 1 = ^&, ...)
     * @param  {Object} result          PostCSS Result object
     * @return {Array}                  Array of ancestor selectors
     */
    function getParentSelectorsAtLevel(node, nestingLevel, result) {
        nestingLevel = nestingLevel || 1;

        // Get parent PostCSS node object at requested nesting level
        var parentNodeAtLevel = getParentNodeAtLevel(node, nestingLevel + 1);

        // Iterate each matching parent node selectors and resolve them
        if (parentNodeAtLevel && parentNodeAtLevel.selectors) {
            return parentNodeAtLevel.selectors
                .map(function (selector) {
                    // Resolve parent selectors for each node
                    return resolvedNestedSelector(selector, parentNodeAtLevel);
                })
                .reduce(function (a, b) {
                    // Flatten array of arrays
                    return a.concat(b);
                });
        } else {
            // Set a warning no matching parent node found
            node.warn(result, 'Parent selector exceeds current stack.');
            return [''];
        }
    }

    /**
     * Given an ancestor placeholder and the PostCSS node object,
     * returns the corresponding parent selectors
     * calculated from the provided PostCSS node object.
     *
     * @param  {String} placeholder     Ancestor placeholder (eg.^^&)
     * @param  {Object} node            PostCSS Node object
     * @param  {Object} result          PostCSS Result object
     * @return {Array}                  Array of ancestor selectors
     */
    function getMatchingParentSelectors(placeholder, node, result) {
        return getParentSelectorsAtLevel(
            node,
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
     * @param  {Array} selectors    Array of CSS selectors / strings
     * @param  {Object} node        a PostCSS Node object
     * @param  {Object} result      a PostCSS Result object
     * @return {String}             Array of Arrays of CSS selectors
     */
    function replacePlaceholders(selectors, node, result) {
        const resolvedSelectors = selectors.map(function (selector) {
            // Look for an ancestor placeholder into selector (eg. ^^&-foo)
            const placeholder = selector.match(placeholderRegex);

            // Ancestor placeholder found (eg. ^^&):
            if (placeholder) {
                /*
                 * Get the array of parent selectors matching current placeholder
                 * (eg. ['.ancestor-1, '.ancestor-2'])
                 */
                // eslint-disable-next-line max-len
                const parentSelectors = getMatchingParentSelectors(placeholder[0], node, result);

                /*
                 * For any parent selector found, return a new selector
                 * by merging current selector and matching parent selectors
                 * (eg. ['.ancestor-1-foo, '.ancestor-2-foo'])
                 */
                return parentSelectors.map(function (parentSelector) {
                    return selector.replace(placeholder[0], parentSelector);
                });
            }

            return selector;
        });
        return resolvedSelectors;
    }

    var process = function (node, result) {
        // Replace parents placeholders in each rule selector
        node.walkRules( function (rule) {
            rule.selectors = replacePlaceholders(rule.selectors, rule, result);
        });

        // Replace parents placeholders in each rule declaration value
        if (opts.replaceDeclarations) {
            node.walkDecls( function (decl) {
                decl.value = decl.value.replace(placeholderRegex, function (placeholder) {
                    return getMatchingParentSelectors(placeholder, decl, result);
                });
            });
        }
    };

    return function (root, result) {
        process(root, result);
    };
});
