var postcss = require('postcss'),
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

	var parentStack = [],

		// Get all ancestors placeholder recurrencies: ^&, ^^&, ^^^&, [...]
		placeholderRegex = new RegExp(
			// eslint-disable-next-line max-len
			'([' + escRgx(opts.levelSymbol) + ']+)(' + escRgx(opts.parentSymbol) + ')(.*)',
			'g'
		),

		// Get any space preceding an ampersand
		spacesAndAmpersandRegex = /\s&/g;

	/**
	 * Walk current ancestor stack and
	 * assembly ancestor selector at the given depth.
	 *
	 * @param  {Number} ancestor nesting depth (0 = &, 1 = ^& = grandparent...)
	 * @param  {Object} a PostCSS Rule object
	 * @param  {Object} a PostCSS Result object
	 * @return {String} ancestor selector
	 */
	function getParentSelectorAtLevel(nestingLevel, rule, result) {
		nestingLevel = nestingLevel || 1;

		// Set a warning when nestingLevel >= parentStack.length
		if ( nestingLevel >= parentStack.length ) {
			rule.warn(result, 'Parent selector exceeds current stack.');
		}

		// Create an array of matching parent selectors
		return parentStack.filter( function (selector, index) {
			return index < parentStack.length - nestingLevel;
		})
			.join(' ')
			.replace(spacesAndAmpersandRegex, '');  // Remove " &"
	}

	/**
	 * Given an ancestor placeholder,
	 * returns the corresponding selector fragment.
	 * Used as replacer in .replace method
	 *
	 * @param  {String} levelSymbol (eg.^^)
	 * @param  {Object} a PostCSS Rule object
	 * @param  {Object} a PostCSS Result object
	 * @return {String} string      ancestor selector fragment
	 */
	function placeholderReplacer(levelSymbol, rule, result) {
		return getParentSelectorAtLevel(

			// Determine how many level symbols ("^") there are
			levelSymbol.split(opts.levelSymbol).length - 1,
			rule,
			result
		);
	}

	/**
	 * Replace any ancestor placeholder into a given selector/string.
	 *
	 * @param  {String} CSS selector / string
	 * @param  {Object} a PostCSS Rule object
	 * @param  {Object} a PostCSS Result object
	 * @return {String} selector
	 */
	function replacePlaceholders(selector, rule, result) {
		return selector.split(/,\s*/).map(function (sel) {
			return sel.replace(
				placeholderRegex,
				function (m, levelSymbol, parentSymbol, end) {
					return placeholderReplacer(levelSymbol, rule, result)
						.split(/,\s*/)
						.map(function (parent) {
							return parent + end;
						}).join(', ');
				}
			);
		}).join(', ');
	}

	var process = function (node, result) {
		node.walkRules(rule => {
			// Replace parent placeholders in rule selectors
			rule.selector = replacePlaceholders(rule.selector, rule, result);

			// Add selector to current parent stack
			parentStack.push(rule.selector);

			// Process child rules
			process(rule, result);
		});

		// Remove current parent stack item at the end of each child iteration
		parentStack.pop();
	};

	return function (root, result) {
		process(root, result);
	};
});
