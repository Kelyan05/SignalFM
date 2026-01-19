const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const SpotifyWebApi = require('spotify-web-api-node')

const app = express();
app.use(cors())
app.use(bodyParser.json())

app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken
    const spotifyApi = new SpotifyWebApi ({
        redirectUri: 'http://127.0.0.1:5173',
        clientId: '69a8fb711b3543609cffb38d914343af',
        clientSecret: '33652cfce6404829b9c4bff04b2c9b94',
        refreshToken,
    })

    spotifyApi.refreshAccessToken().then(
        (data) => {
            res.json({
                accessToken: data.body.accessToken,
                expressIn: data.body.expiresIn,
            })
        }).catch(err  => {
            console.log(err)
            res.sendStatus(400)
        })
})


app.post('/login', (req, res) => {
    const code = req.body.code
    const spotifyApi = new SpotifyWebApi ({
        redirectUri: 'http://127.0.0.1:5173',
        clientId: '69a8fb711b3543609cffb38d914343af',
        clientSecret: '33652cfce6404829b9c4bff04b2c9b94'
    })

    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.json( {
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expressIn: data.body.expires_in,
        })
    })
    .catch(err => {
        res.sendStatus(400)
    })
})

app.listen(3001)