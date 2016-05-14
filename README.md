# PostCSS Nested Grandpa [![Build Status][ci-img]][ci]

[PostCSS] plugin to reference grandparent selectors in nested CSS.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/toomuchdesign/postcss-nested-grandpa.svg
[ci]:      https://travis-ci.org/toomuchdesign/postcss-nested-grandpa

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-nested-grandpa') ])
```

See [PostCSS] docs for examples for your environment.
