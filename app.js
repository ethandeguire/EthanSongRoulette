// get all necessary libraries into objects 
const express = require('express')
const querystring = require('querystring');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const request = require('request-promise');

const auth = require('./auth')
const spotifyHelpers = require('./spotify-api')
const db = require('./db').get_db()

// express is server framework that handles all incoming traffic / gives way to interface with it
const app = express()
const port = 8888

const stateKey = 'spotify_auth_state';
const accessTokenKey = 'spotify_access_token';
const refreshTokenKey = 'spotify_refresh_token';

const client_id = '9bb800a54e494ae98535595d56a01e09'; // Your client id
const client_secret = '94732f44671d4f4194180dae7fd8b63b'; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

app.set('view engine', 'ejs')
app.use(cors())
app.use(cookieParser());

// initial rendering 
app.get('/', function (req, res) {
    res.render('pages/index')
})

// homepage 
app.get('/home', async function (req, res) {
    let access_token = await auth.get_access_token(req, res, accessTokenKey)
    if (!access_token) return

    let user = await spotifyHelpers.get_user(access_token)

    if (!db.user_has_synced_playlist(user.id)) {
        res.redirect('/sync')
        return
    }
    
    let songs = db.get_user_synced_playlist(user.id)
    // console.log("songs:", songs)

    // display this data using home.ejs 
    res.render('pages/home', {
        user: user,
        songs: songs
    })
})

app.get('/party/:id', async function(req, res) {
    let access_token = await auth.get_access_token(req, res, accessTokenKey)
    if (!access_token) return

    let user = await spotifyHelpers.get_user(access_token)
    let partyid = req.params['id']
    console.log("partyid:", partyid)

    db.add_user_to_party(user.id, partyid)

    res.render('pages/party', {
        partyid: partyid
    })
})

app.get('/party/:id/getsong', async function(req, res){

    let partyid = req.params['id']
    let users_in_party = db.get_users_in_party(partyid)

    // pick random user 
    let user = users_in_party[Math.floor(Math.random() * users_in_party.length)];
    
    // get user songs 
    let songs = db.get_user_synced_playlist(user);

    // pick random song 
    let song = songs[Math.floor(Math.random() * songs.length)];

    // determine who has song 
    let users_have_song = db.get_users_have_song(users_in_party, song.track.id)

    // get user profiles who have the song:
    user_profiles = users_have_song.map(userid => db.get_user_details(userid))

    res.send({song: song, users_have_song: user_profiles})

})



// login 
app.get('/sync', async function(req, res) {
    let access_token = await auth.get_access_token(req, res, accessTokenKey)
    if (!access_token) return

    let user = await spotifyHelpers.get_user(access_token)
    db.add_user_details(user)
    let songs = await spotifyHelpers.get_liked_tracks(access_token)
    db.update_user_synced_playlist(user.id, songs)
    res.redirect('/home')
})

app.get('/login', function (req, res) {
    var state = auth.generate_random_string(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email user-library-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

// callback behaviour 
app.get('/callback', function (req, res) {

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let access_token = body.access_token;
                let refresh_token = body.refresh_token;

                res.cookie(accessTokenKey, access_token);
                res.cookie(refreshTokenKey, refresh_token);
                res.redirect('/home')
                // res.redirect('/home?' +
                //     querystring.stringify({
                //         access_token: access_token,
                //         refresh_token: refresh_token
                //     }));

            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        })
    }
});

app.listen(port, function () {
    console.log(`App listening at port ${port}`)
})
