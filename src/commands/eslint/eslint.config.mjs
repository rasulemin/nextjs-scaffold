import antfu from '@antfu/eslint-config'

export default antfu(
    {
        nextjs: true,
        formatters: false,
        stylistic: false,
        lessOpinionated: true,
        typescript: true,
        jsx: true,
    },
    {
        rules: {
            'no-console': ['warn', { allow: ['info'] }],
            'antfu/no-top-level-await': 'off', // Allow top-level await
            'ts/consistent-type-definitions': ['error', 'type'], // Use `type` instead of `interface`
            'node/prefer-global/process': 'off', // Allow using `process.env`
            'unicorn/filename-case': [
                'error',
                {
                    case: 'kebabCase',
                    ignore: ['\\.md$', '\\.mdx$', '\\.json$'],
                },
            ],
            'jsx-a11y/media-has-caption': 'off', // Allow media without captions
            'ts/no-use-before-define': ['error', { functions: false }], // Allow using functions (components) before they are defined
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        // Example left for reference:
                        // {
                        //     name: 'react-error-boundary',
                        //     message:
                        //         'Please import from `@/components/error-boundary` instead.',
                        //     importNames: ['withErrorBoundary', 'ErrorBoundary'],
                        // },
                    ],
                },
            ],
            // Temporary fix for eslint-plugin-unicorn compatibility issue
            'unicorn/error-message': 'off',
        },
    },
)
