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
     * @return {String}                 Ancestor selector
     */
    function getParentSelectorAtLevel(rule, nestingLevel, result) {
        nestingLevel = nestingLevel || 1;

        // Get parent PostCSS rule object at requested nesting level
        var parentNodeAtLevel = getParentNodeAtLevel(rule, nestingLevel + 1);

        if (parentNodeAtLevel && parentNodeAtLevel.selectors) {
            // parentNodeAtLevel.selectors.forEach(function(selector) {
            //     return resolvedNestedSelector(selector, parentNodeAtLevel)[0];
            // });
            return resolvedNestedSelector(parentNodeAtLevel.selector, parentNodeAtLevel)[0];
        } else {
            // Set a warning no matching parent node found
            rule.warn(result, 'Parent selector exceeds current stack.');
            return '';
        }
    }

    /**
     * Given an ancestor placeholder and the PostCSS node object,
     * returns the corresponding parent selector fragment
     * calculated from the provided PostCSS node object.
     * Used as replacer in .replace method
     *
     * @param  {String} placeholder     Ancestor placeholder (eg.^^&)
     * @param  {Object} rule            PostCSS Rule/Node object
     * @param  {Object} result          PostCSS Result object
     * @return {String}                 Ancestor selector
     */
    function placeholderReplacer(placeholder, rule, result) {
        return getParentSelectorAtLevel(

            // Get how many level symbols ("^") has current placeholder
            rule,
            placeholder.lastIndexOf(opts.levelSymbol) / opts.levelSymbol.length  + 1,
            result
        );
    }

    /**
     * Given a selector string and its PostCSS node object,
     * return a string rapresenting the provided selector
     * with ancestor placeholder replaced with actual parent selectors
     *
     * @param  {String} selector    CSS selector / string
     * @param  {Object} rule        a PostCSS Rule/Node object
     * @param  {Object} result      a PostCSS Result object
     * @return {String} selector
     */
    function replacePlaceholders(selector, rule, result) {

        // Find placeholders and replace them with matching parent selector
        return selector.replace(
            placeholderRegex,
            function (placeholder) {
                return placeholderReplacer(placeholder, rule, result);
            }
        );
    }

    var process = function (node, result) {
        node.each( function (rule) {
            if (rule.type === 'rule') {

                // Replace parents placeholders in rule selectors
                rule.selector = replacePlaceholders(rule.selector, rule, result);

                // Process child rules
                process(rule, result);
            }

            // Optionally replace parents placeholders into declarations
            // eslint-disable-next-line brace-style
            else if (opts.replaceDeclarations && rule.type === 'decl') {
                rule.value = replacePlaceholders(rule.value, rule, result);
                rule.prop = replacePlaceholders(rule.prop, rule, result);
            }
        });
    };

    return function (root, result) {
        process(root, result);
    };
});
