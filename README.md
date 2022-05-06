# PostCSS Nested ancestors

[![Build status][ci-badge]][ci]
[![Npm version][npm-version-badge]][npm]
[![Test coverage report][coveralls-badge]][coveralls]

[PostCSS] plugin to reference any parent ancestor selector in nested CSS.

## Getting ancestor selectors

When writing modular nested CSS, `&` current parent selector is often not enough.

**PostCSS Nested ancestors** introduces `^&` selector which let you reference **any parent ancestor selector** with an easy and customizable interface.

This plugin should be used **before** a PostCSS rules unwrapper like [postcss-nested].

See [PostCSS] docs for examples for your environment.

### Ancestor selectors schema

```
    .level-1 {
|   |   .level-2 {
|   |   |   .level-3 {
|   |   |   |   .level-4 {
|   |   |   |   |
|   |   |   |   --- & {}        /*      & = ".level-1 .level-2 .level-3 .level-4" */
|   |   |   ------- ^& {}       /*     ^& = ".level-1 .level-2 .level-3"          */
|   |   ----------- ^^& {}      /*    ^^& = ".level-1 .level-2"                   */
|   --------------- ^^^& {}     /*   ^^^& = ".level-1"                            */
------------------- ^^^^& {}    /*  ^^^^& = ""                                    */
                }
            }
        }
    }
```

### A real example

```css
/* Without postcss-nested-ancestors */
.MyComponent
    &-part{}
    &:hover {
        > .MyComponent-part {} /* Must manually repeat ".MyComponent" for each child */
    }
}

/* With postcss-nested-ancestors */
.MyComponent
    &-part{}
    &:hover {
        > ^&-part {} /* Skip ":hover" inheritance here */
    }
}

/* After postcss-nested-ancestors */
.MyComponent {
    &-part{}
    &:hover {
        > .MyComponent-part {}
}

/* After postcss-nested */
.MyComponent {}
.MyComponent-part {}
.MyComponent:hover {}
.MyComponent:hover > .MyComponent-part {} /* No ":hover" inheritance here! */

```

## Why?

Currently another plugin - [postcss-current-selector] - has tried to solve the problem of referencing ancestors selector. It works great, but its approach involves assigning ancestor selectors to special variables to be later processed by a further postcss plugin [postcss-simple-vars].

**PostCSS Nested ancestors** instead replaces special ancestor selectors, makes no use of variable assignment and produces an output ready to be unwrapped with [postcss-nested].

## Installation

```console
$ npm install --save-dev postcss postcss-nested-ancestors
```

## Usage

```js
postcss([require('postcss-nested-ancestors')]);
```

## Options

### placeholder

Type: `string`
Default: `^&`

Ancestor selector pattern (utility option to automatically set both `levelSymbol` and `parentSymbol`)

### levelSymbol

Type: `string`
Default: `^`

Define ancestor selector fragment relative to the matching nesting level

### parentSymbol

Type: `string`
Default: `&`

Ancestor selector base symbol

### replaceDeclarations (experimental)

Type: `boolean`
Default: `false`

If this is true then this plugin will look through your declaration values for the placeholder symbol and replace them with specified selector.

An use case for this if enabling [postcss-ref](https://github.com/morishitter/postcss-ref) to work with dynamic `@ref` selectors. Read discussion [here](https://github.com/toomuchdesign/postcss-nested-ancestors/pull/3).

```css
/* Before */
.foo {
  &:last-child {
    border-top: ref(^&, border-bottom);
  }
}

/* After PostCSS Nested ancestors and PostCSS Nested */
.foo {
}

.foo:last-child {
  border-top: ref(.foo, border-bottom);
}
```

## Known issues

### Multiple ancestor placeholders in same selector

This plugin currently fails when trying to replace **more than one different ancestor placeholder in a single rule selector**. This scenario has not been considered in order to not bloat the code with a remote use case.

More precisely, all ancestor placeholders are replaced, but processed as if they where the equal to the first ancestor placeholder found in selector.

In general, **do not use more than one ancestor placeholder in a single rule selector**. Anyway, this use case can be rewritten by **splitting the selectors in multiple nested rules** (see edge case 2).

#### Edge case 1 (success)

```css
/* 2 equal ancestor placeholders in single rule selector */
.a {
  &:hover {
    ^&^&-b {
    }
  }
}

/* Output: It works but casts a warning */
.a {
  &:hover {
    .a.a-b {
    }
  }
}
```

#### Edge case 2 (failing)

```css
/* 2 different ancestor placeholders in single rule selector */
.a {
  &-b {
    &:hover {
      /* Will be processed as ^&^&-c{}, sorry! */
      ^&^^&-c {
      }
    }
  }
}

/* Wrong output: All placeholder replaced with the value of the first one */
.a {
  &-b {
    &:hover {
      /* Expected output: .a-b.a-c{}*/
      .a-b.a-b-c {
      }
    }
  }
}

/* This use case can be rewritten as: */
.a {
  &-b {
    &:hover {
      ^& {
        &^^^&-c {
        }
      }
    }
  }
}
```

### Replace declaration values in complex nesting scenarios

`replaceDeclarations` options used in a complex nesting scenario might have undesired outputs because of the different nature of CSS selectors and and declaration values.

In general, avoid replacing declaration values when inside a rule with multiple selectors (but why should you?). In other words don't get yourself into trouble!

Here is an example of what you don't want to do.

```css
/* Don't replace declaration value inside multiple selector rules */
.a1,
.a2 {
  &:hover {
    &:before {
      content: '^^&';
    }
  }
}

/* Output */
.a1,
.a2 {
  &:hover {
    &:before {
      content: '.a1,.a2';
    }
  }
}
```

## Contributing

Contributions are super welcome, but please follow the conventions below if you want to do a pull request:

- Create a new branch and make the pull request from that branch
- Each pull request for a single feature or bug fix
- If you are planning on doing something big, please discuss first with [@toomuchdesign](http://www.twitter.com/toomuchdesign) about it
- Update tests (`test.js`) covering new features

## Todo's

- Better comment source code

[postcss]: https://github.com/postcss/postcss
[ci-badge]: https://github.com/toomuchdesign/postcss-nested-ancestors/actions/workflows/ci.yml/badge.svg
[ci]: https://github.com/toomuchdesign/postcss-nested-ancestors/actions/workflows/ci.yml
[coveralls-badge]: https://coveralls.io/repos/github/toomuchdesign/postcss-nested-ancestors/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/toomuchdesign/postcss-nested-ancestors?branch=master
[npm]: https://www.npmjs.com/package/postcss-nested-ancestors
[npm-version-badge]: https://img.shields.io/npm/v/postcss-nested-ancestors.svg
[postcss-current-selector]: https://github.com/komlev/postcss-current-selector
[postcss-nested]: https://github.com/postcss/postcss-nested
[postcss-simple-vars]: https://github.com/postcss/postcss-simple-vars
