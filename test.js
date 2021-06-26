const postcss = require('postcss');
const test = require('ava');
const plugin = require('./');

function run(t, input, output, opts = {}, warnings = 0) {
  return postcss([plugin(opts)])
    .process(input)
    .then((result) => {
      t.deepEqual(result.css, output);
      t.deepEqual(result.warnings().length, warnings);
    });
}

test('Chain ancestor in a simple case', (t) => {
  return run(t, '.a{ &:hover{ ^&-b{} } }', '.a{ &:hover{ .a-b{} } }', {});
});

test('Prepend ancestor in a simple case', (t) => {
  return run(t, '.a{ &:hover{ ^& .b{} } }', '.a{ &:hover{ .a .b{} } }', {});
});

test('Replace ancestor selectors in sibling rules', (t) => {
  return run(
    t,
    '.a{ &:hover{ ^&-b1{} ^&-b2{} ^& .b3{} } }',
    '.a{ &:hover{ .a-b1{} .a-b2{} .a .b3{} } }',
    {}
  );
});

test('Chain 2 ancestors in double selector', (t) => {
  return run(
    t,
    '.a{ &:hover{ ^&-b, ^&-c{} } }',
    '.a{ &:hover{ .a-b, .a-c{} } }',
    {}
  );
});

test('Prepend 2 ancestors in double selector', (t) => {
  return run(
    t,
    '.a{ &:hover{ ^& .b, ^& .c{} } }',
    '.a{ &:hover{ .a .b, .a .c{} } }',
    {}
  );
});

test('Return empty string when pointing to a non-existent ancestor', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ ^^^^&-d{} } } }',
    '.a{ &-b{ &-c{ -d{} } } }',
    {},
    1
  );
});

test('Process 2 nested ancestor selectors', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ ^^&-d{ &-e{ ^^^^&-f{ } } } } } }',
    '.a{ &-b{ &-c{ .a-d{ &-e{ .a-f{ } } } } } }',
    {}
  );
});

test('Replace with root comment', (t) => {
  return run(
    t,
    '/* This is a comment */ .a{ &:hover{ ^& .b, ^& .c{} } }',
    '/* This is a comment */ .a{ &:hover{ .a .b, .a .c{} } }',
    {}
  );
});

test('Replace with nested comment', (t) => {
  return run(
    t,
    '.a{ &:hover{ /* This is a comment */ ^& .b, ^& .c{} } }',
    '.a{ &:hover{ /* This is a comment */ .a .b, .a .c{} } }',
    {}
  );
});

// replaceDeclarations option
test('Replace declaration values (I)', (t) => {
  return run(
    t,
    '.a{ &:hover { &:before { content: "^&"; } } }',
    '.a{ &:hover { &:before { content: ".a:hover"; } } }',
    { replaceDeclarations: true }
  );
});

test('Replace declaration values (II)', (t) => {
  return run(
    t,
    '.a{ &:hover { &:before { content: "^^&.foo"; } } }',
    '.a{ &:hover { &:before { content: ".a.foo"; } } }',
    { replaceDeclarations: true }
  );
});

test('Replace declaration values with multiple parent selector', (t) => {
  return run(
    t,
    '.a1,.a2{ &:hover { &:before { content: "^^&"; } } }',
    '.a1,.a2{ &:hover { &:before { content: ".a1,.a2"; } } }',
    { replaceDeclarations: true }
  );
});

test('Replace ancestors at different nesting levels', (t) => {
  return run(
    t,
    '.a{ &:hover{ ^&-b{} } .c{ .d{ ^&-e{} } } .z{} }',
    '.a{ &:hover{ .a-b{} } .c{ .d{ .a .c-e{} } } .z{} }',
    {}
  );
});

test('Replace ancestors with 4 different hierarchy levels (1 exceeding)', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ &-d{} ^&-d,^&-d{} ^^&-d{} ^^^&-d{} } } }',
    '.a{ &-b{ &-c{ &-d{} .a-b-d,.a-b-d{} .a-d{} -d{} } } }',
    {},
    1
  );
});

test('Process nested ancestor close to > , + and ~ selectors', (t) => {
  return run(
    t,
    '.a{ &-b{ > ^&-c{} + ^&-d{} ~ ^&-e{} } }',
    '.a{ &-b{ > .a-c{} + .a-d{} ~ .a-e{} } }',
    {}
  );
});

test('Replace default ancestor selector with "£%"', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ ££%-d{ £££%-f{ } } } } }',
    '.a{ &-b{ &-c{ .a-d{ .a-f{ } } } } }',
    { placeholder: '£%' }
  );
});

test('Replace default ancestor with custom levelSymbol and parentSymbol', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ foofoobar-d{ foofoofoobar-f{ } } } } }',
    '.a{ &-b{ &-c{ .a-d{ .a-f{ } } } } }',
    { levelSymbol: 'foo', parentSymbol: 'bar' }
  );
});

// Complex nesting
test('Generate comma separated selectors when root element has multiple selectors', (t) => {
  return run(
    t,
    '.a1,.a2{ .b{ &:hover{ ^& .c{} } } }',
    '.a1,.a2{ .b{ &:hover{ .a1 .b .c,.a2 .b .c{} } } }',
    {}
  );
});

test('Generate comma separated selectors when root element has multiple selectors + "&" selector', (t) => {
  return run(
    t,
    '.a1,.a2{ &-b{ &:hover{ ^&-c{} } } }',
    '.a1,.a2{ &-b{ &:hover{ .a1-b-c,.a2-b-c{} } } }',
    {}
  );
});

test('Generate comma separated selectors when two ancestors have multiple selectors', (t) => {
  return run(
    t,
    '.a1,.a2{ .b1,.b2{ &:hover{ ^& .c{} } } }',
    '.a1,.a2{ .b1,.b2{ &:hover{ .a1 .b1 .c,.a2 .b1 .c,.a1 .b2 .c,.a2 .b2 .c{} } } }',
    {}
  );
});

test('Generate comma separated selectors when two ancestors have multiple selectors + "&" selectors', (t) => {
  return run(
    t,
    '.a1,.a2{ &-b1,&-b2{ &:hover{ ^&-c{} } } }',
    '.a1,.a2{ &-b1,&-b2{ &:hover{ .a1-b1-c,.a2-b1-c,.a1-b2-c,.a2-b2-c{} } } }',
    {}
  );
});

test('Generate comma separated selectors when two ancestors have multiple selectors + one "&" selector', (t) => {
  return run(
    t,
    '.a1,.a2{ .b1,&-b2{ &:hover{ ^&-c{} } } }',
    '.a1,.a2{ .b1,&-b2{ &:hover{ .a1 .b1-c,.a2 .b1-c,.a1-b2-c,.a2-b2-c{} } } }',
    {}
  );
});

test('Do not consider media queries when building ancestor selectors', (t) => {
  return run(
    t,
    '.a{ &-b{ &-c{ @media (max-width: 320px){ ^&-d{} &-d{} } } } }',
    '.a{ &-b{ &-c{ @media (max-width: 320px){ .a-b-d{} &-d{} } } } }',
    {}
  );
});

// Ancestor selector repeated in same rule
test('Use same ancestor selector twice in same rule', (t) => {
  return run(
    t,
    '.a{ &:hover{ ^&^& .b{} ^&^&-b{} } }',
    '.a{ &:hover{ .a.a .b{} .a.a-b{} } }',
    {},
    2
  );
});

test('Use same ancestor selector twice in same rule inside multiple selector rule (I)', (t) => {
  return run(
    t,
    '.a1,.a2{ &:hover{ ^&^&-b{} } }',
    '.a1,.a2{ &:hover{ .a1.a1-b,.a2.a2-b{} } }',
    {},
    1
  );
});

test('Use same ancestor selector twice in same rule inside multiple selector rule (II)', (t) => {
  return run(
    t,
    '.a1,.a2{ &-b1,&-b2{ &:hover{ ^&^&-c{} } } }',
    '.a1,.a2{ &-b1,&-b2{ &:hover{ .a1-b1.a1-b1-c,.a2-b1.a2-b1-c,.a1-b2.a1-b2-c,.a2-b2.a2-b2-c{} } } }',
    {},
    1
  );
});

test.failing('Use two different ancestor placeholders in same rule', (t) => {
  return run(
    t,
    '.a{ &-b{ &:hover{ ^&^^&-c{} } } }',
    '.a{ &-b{ &:hover{ .a-b.a-c{} } } }',
    {},
    1
  );
});

test('Alternative to having two different ancestor placeholders in same rule', (t) => {
  return run(
    t,
    '.a{ &-b{ &:hover{ ^& { &^^^&-c{} } } } }',
    '.a{ &-b{ &:hover{ .a-b { &.a-c{} } } } }',
    {}
  );
});
