module.exports = {
    extends: [
        'react-app',
        'prettier' // prettier와 충돌하는 ESLint 규칙 비활성화
    ],
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'error',
        'max-len': [
            'error',
            {
                code: 120,
                tabWidth: 4,
                ignoreUrls: true,
                ignoreComments: false,
                ignoreRegExpLiterals: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
            }
        ],
    },
}