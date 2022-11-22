/* Helper functions for spotify auth */
const querystring = require('querystring');
const { get_user } = require('./spotify-api');

function generate_random_string (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

async function check_access_token(access_token) {
    try {
        await get_user(access_token)
        return true
    } catch (error) {
        console.log("CAUGHT ERR: ", error)
        return false
    }
}

async function get_access_token(req, res, accessTokenKey) {
    let access_token = req.cookies[accessTokenKey] || null;
    if (!access_token) {
        await res.redirect('/#' +
            querystring.stringify({
                error: 'invalid_token'
            }));
        return false
    }
    if (!await check_access_token(access_token)){
        console.log("FAILED CHECK ACCESS TOKEN")
        res.clearCookie(accessTokenKey)
        await res.redirect('/')
        return false
    }
    return access_token
}

// Export functions
module.exports = { generate_random_string, get_access_token }