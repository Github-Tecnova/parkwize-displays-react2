module.exports = {
    webpack: {
        configure: (config) => {
            // Force babel to transpile these packages
            const oneOfRule = config.module.rules.find(r => r.oneOf);
            if (oneOfRule) {
                oneOfRule.oneOf.forEach(rule => {
                    if (rule.loader && rule.loader.includes('babel-loader')) {
                        rule.include = undefined;
                        rule.exclude = /node_modules\/(?!(@parkwize|@evovee)\/).*/;
                    }
                });
            }
            return config;
        }
    }
};