import postcss from 'postcss';
import test    from 'ava';

import plugin from './';

function run(t, input, output, opts = { }, warnings = 0) {
    return postcss([ plugin(opts) ]).process(input)
        .then( result => {
            t.deepEqual(result.css, output);
            t.deepEqual(result.warnings().length, warnings);
        });
}

test('Chain ancestor in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } }',
                '.a{ &:hover{ .a-b{} } }',
                { }
    );
});

test('Prepend ancestor in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^& .b{} } }',
                '.a{ &:hover{ .a .b{} } }',
                { }
    );
});

test('Chain 2 ancestors in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^&-b, ^&-c{} } }',
                '.a{ &:hover{ .a-b, .a-c{} } }',
                { }
    );
});

test('Prepend 2 ancestors in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^& .b, ^& .c{} } }',
                '.a{ &:hover{ .a .b, .a .c{} } }',
                { }
    );
});

test('Replace with root comment', t => {
    return run( t,
                '/* This is a comment */ .a{ &:hover{ ^& .b, ^& .c{} } }',
                '/* This is a comment */ .a{ &:hover{ .a .b, .a .c{} } }',
                { }
    );
});

test('Replace with nested comment', t => {
    return run( t,
                '.a{ &:hover{ /* This is a comment */ ^& .b, ^& .c{} } }',
                '.a{ &:hover{ /* This is a comment */ .a .b, .a .c{} } }',
                { }
    );
});

test('Replace declaration values if replaceValues is true', t => {
    return run( t,
                '.a{ &:hover { &:before { content: "^&"; } } }',
                '.a{ &:hover { &:before { content: ".a:hover"; } } }',
                { replaceDeclarations: true }
    );
});

test('Replace declaration values if replaceDeclarations is true', t => {
    return run( t,
                '.a{ &:hover { &:before { content: "^^&"; } } }',
                '.a{ &:hover { &:before { content: ".a"; } } }',
                { replaceDeclarations: true }
    );
});

test('Replace ancestors at different nesting levels', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } .c{ .d{ ^&-e{} } } .z{} }',
                '.a{ &:hover{ .a-b{} } .c{ .d{ .a .c-e{} } } .z{} }',
                { }
    );
});

test('Replace ancestors with 4 different hierarchy levels (1 exceeding)', t => {
    return run( t,
                '.a{ &-b{ &-c{ &-d{} ^&-d, ^&-d{} ^^&-d{} ^^^&-d{} } } }',
                '.a{ &-b{ &-c{ &-d{} .a-b-d, .a-b-d{} .a-d{} -d{} } } }',
                { },
                1
    );
});

test('Process 2 nested ancestors', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^^&-d{ &-e{ ^^^^&-f{ } } } } } }',
                '.a{ &-b{ &-c{ .a-d{ &-e{ .a-f{ } } } } } }',
                { }
    );
});

test('Process nested ancestor close to > \, + and ~ selectors', t => {
    return run( t,
                '.a{ &-b{ > ^&-c{} + ^&-d{} ~ ^&-e{} } }',
                '.a{ &-b{ > .a-c{} + .a-d{} ~ .a-e{} } }',
                { }
    );
});

test('Return empty string when pointing to a non-existent ancestor', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^^^^&-d{} } } }',
                '.a{ &-b{ &-c{ -d{} } } }',
                { },
                1
    );
});

test('Replace default ancestor selector with \"£%\"', t => {
    return run( t,
                '.a{ &-b{ &-c{ ££%-d{ £££%-f{ } } } } }',
                '.a{ &-b{ &-c{ .a-d{ .a-f{ } } } } }',
                { placeholder: '£%' }
    );
});

test('Replace default ancestor with custom levelSymbol and parentSymbol', t => {
    return run( t,
                '.a{ &-b{ &-c{ foofoobar-d{ foofoofoobar-f{ } } } } }',
                '.a{ &-b{ &-c{ .a-d{ .a-f{ } } } } }',
                { levelSymbol: 'foo', parentSymbol: 'bar' }
    );
});

test('Complex nesting: ancestors with multiple selectors', t => {
    return run( t,
                '.a, .b{ &:after{ ^&-c{} } }',
                '.a, .b{ &:after{ .a-c, .b-c{} } }',
                { }
    );
});

test('Complex nesting: ancestors with multiple selectors on newlines', t => {
    return run( t,
        `.a,
        .b {
            &:after {
                ^&-c,
                ^&-d {}
            }
        }`,
        `.a, .b {
            &:after {
                .a-c, .b-c, .a-d, .b-d {}
            }
        }`,
        { }
    );
});
