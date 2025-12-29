import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#000000' },
                { name: 'gray', value: '#1a1a1a' },
                { name: 'light', value: '#ffffff' },
            ],
        },
    },
};

export default preview;