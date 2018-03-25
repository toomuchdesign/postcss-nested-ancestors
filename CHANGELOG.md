## 2.0.0
- Consider `rule` nodes only when when building ancestor selectors
- Use `PostCSS` 6
- Restrict support to `node.js` >= 4
- Remove `object-assign` dependency

## 1.0.0
- Solve complex nesting scenarios scenarios externalizing parent selectors resolution to [postcss-resolve-nested-selector](https://github.com/davidtheclark/)
- Refactor bootstrap function using `walkRules` and `walkDecls` PostCSS methods
- `replaceDeclarations` option will replace declaration values only

## 0.1.0
- Add experimental `replaceDeclarations` option, to process declaration props and values, too
- Cast warning when nestingLevel >= parentsStack.length
- Move `spacesAndAmpersandRegex` regex into a reusable regex
- Add a failing test case documenting issues when complex nesting

## 0.0.1
- Fix `levelSymbol` and `parentSymbol` options not being used

## 0.0.0
- Initial release
