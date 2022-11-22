/* Helper functions for the spotify API */
const request = require('request-promise');

// Get the logged in user profile
async function get_user(access_token) {
    let options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    return await request.get(options);
}

async function get_all_pages(access_token, url, list = []) {
    let options = {
        url: url,
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    res = await request.get(options);
    list.push(...res['items'])
    if (res['next']) return await get_all_pages(access_token, res['next'], list)
    else return list
}

async function get_liked_tracks(access_token) {
    return get_all_pages(access_token, 'https://api.spotify.com/v1/me/tracks?limit=50')
}

async function get_user_playlists(access_token) {
    return get_all_pages(access_token, 'https://api.spotify.com/v1/me/playlists?limit=50')
}

async function get_playlist_tracks(access_token, playlist_id) {
    return get_all_pages(access_token, `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=50`)
}

// Export functions
module.exports = { get_user, get_liked_tracks, get_user_playlists, get_playlist_tracks }