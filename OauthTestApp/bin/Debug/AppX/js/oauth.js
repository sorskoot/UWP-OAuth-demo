/// <reference path="../WinJS/js/base.js" />
/// <reference path="../WinJS/js/ui.js" />

(function () {
    WinJS.Namespace.define("TimmyTools", {
        oauth: WinJS.Class.define(
            function () {
                this.refreshToken = retreiveTokenFromVault();
            },
            {
                connect: function () {
                    return new Promise((done, error) => {
                        if (!this.refreshToken) {
                            authenticate().then(
                                token => grant(token).then(accessToken=> {
                                    let cred = new Windows.Security.Credentials
                                                    .PasswordCredential("OauthToken",
                                      "CurrentUser", accessToken.refresh_token);
                                    this.refreshToken = accessToken.refresh_token;
                                    let passwordVault = new Windows.Security.Credentials.PasswordVault();
                                    passwordVault.add(cred);

                                    done(accessToken);

                                }));
                        } else {
                            refresh(this.refreshToken)
                                .then(accessToken => done(accessToken));
                        }
                    });
                }
            }
        )
    });

    function retreiveTokenFromVault() {
        let passwordVault = new Windows.Security.Credentials.PasswordVault(),
            storedToken;

        try {
            let credential = passwordVault.retrieve("OauthToken", "CurrentUser");
            storedToken = credential.password;
            // Uncomment this line to remove the token from the password vault 
            // so you'll have to log in again.
            // passwordVault.remove(credential); 
        } catch (e) {
            // no stored credentials
        }
        return storedToken;
    }

    function grant(token) {
        let oauthUrl = youtubeConfig.token_uri,
            clientId = youtubeConfig.client_id,
            clientSecret = youtubeConfig.client_secret,
            redirectUrl = youtubeConfig.redirect_uris[0];

        return WinJS.xhr({
            type: "post",
            url: oauthUrl,
            data: serializeData({
                code: token,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUrl,
                grant_type: 'authorization_code'
            }),
            headers:
            {
                "Content-type": "application/x-www-form-urlencoded; charset=utf-8"
            }
        }).then(x=>JSON.parse(x.response));
    };

    function refresh(token) {
        let oauthUrl = youtubeConfig.token_uri,
            clientId = youtubeConfig.client_id,
            clientSecret = youtubeConfig.client_secret,
            redirectUrl = youtubeConfig.redirect_uris[0];

        return WinJS.xhr({
            type: "post",
            url: oauthUrl,
            data: serializeData({
                refresh_token: token,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUrl,
                grant_type: 'refresh_token'
            }),
            headers:
            {
                "Content-type": "application/x-www-form-urlencoded; charset=utf-8"
            }
        }).then(x=>JSON.parse(x.response));
    }

    /// authenticate at YouTube
    function authenticate() {
        return new Promise(function (complete, error) {
            let oauthUrl = youtubeConfig.auth_uri,
                clientId = youtubeConfig.client_id,
                redirectUrl = youtubeConfig.redirect_uris[0],
                scope = ['https://www.googleapis.com/auth/youtube',
                         'https://www.googleapis.com/auth/youtube.force-ssl',
                         'https://www.googleapis.com/auth/youtube.readonly'
                ].join('+');
            let requestUri = Windows.Foundation.Uri(
                                  `${oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&access_type=offline&scope=${scope}&display=popup`);
            let callbackUri = Windows.Foundation.Uri(redirectUrl);
            Windows.Security.Authentication.Web.WebAuthenticationBroker.
                authenticateAsync(Windows.Security.Authentication.Web.
                    WebAuthenticationOptions.none, requestUri, callbackUri)
                .done(
                    result=> {
                        if (result.responseStatus == 0) {
                            complete(result.responseData.replace('https://localhost/oauth2callback?code=',
                                                                 ''));
                        } else {
                            error(result);
                        }
                    }
                );
        });
    }

    /// Serialize a piece of data to a querystring
    function serializeData(data, encode) {

        if (typeof data !== 'object') {
            return ((data == null) ? "" : data.toString());
        }
        let buffer = [];

        // Serialize each key in the object.
        for (let name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            let value = data[name];
            if (!!encode) {
                buffer.push(`${encodeURIComponent(name)} = ${encodeURIComponent((value == null) ? "" : value)}`);
            } else {
                buffer.push(`${name}=${value == null ? "" : value}`);
            }
        }
        // Serialize the buffer and clean it up for transportation.
        let source = buffer.join("&").replace(/%20/g, "+");
        return (source);
    }

})();