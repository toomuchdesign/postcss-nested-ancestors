# PostCSS Nested ancestors [![Build Status][ci-img]][ci]

[PostCSS] plugin to reference any ancestor selector in nested CSS.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/toomuchdesign/postcss-nested-ancestors.svg
[ci]:      https://travis-ci.org/toomuchdesign/postcss-nested-ancestors

## Installation

```console
$ npm install postcss-nested-ancestor
```

## Usage

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

**This plugin should be used just **before** POSTCSS rules unwrapper like [postcss-nested](https://github.com/postcss/postcss-nested).

See [PostCSS] docs for examples for your environment.
