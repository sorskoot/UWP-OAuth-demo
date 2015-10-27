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
                    return new WinJS.Promise((done, error) => {
                        if (!this.refreshToken) {
                            authenticate().then(
                                token => grant(token).then(accessToken=> {
                                    let cred = new Windows.Security.Credentials.PasswordCredential("OauthToken",
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
        } catch (e) {
            // no stored credentials
        }
        return storedToken;
    }

    function grant(token) {
        var oauthUrl = youtubeConfig.token_uri;
        var clientId = youtubeConfig.client_id;
        var clientSecret = youtubeConfig.client_secret;
        var redirectUrl = youtubeConfig.redirect_uris[0];

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
        var oauthUrl = youtubeConfig.token_uri;
        var clientId = youtubeConfig.client_id;
        var clientSecret = youtubeConfig.client_secret;
        var redirectUrl = youtubeConfig.redirect_uris[0];

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
        return new WinJS.Promise(function (complete, error) {
            var oauthUrl = youtubeConfig.auth_uri;
            var clientId = youtubeConfig.client_id;
            var redirectUrl = youtubeConfig.redirect_uris[0];
            let scope = ['https://www.googleapis.com/auth/youtube',
                         'https://www.googleapis.com/auth/youtube.force-ssl',
                         'https://www.googleapis.com/auth/youtube.readonly'
            ].join('+');
            var requestUri = Windows.Foundation.Uri(
                `${oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&access_type=offline&scope=${scope}&display=popup`);

            var callbackUri = Windows.Foundation.Uri(redirectUrl);
            Windows.Security.Authentication.Web.WebAuthenticationBroker.
                authenticateAsync(Windows.Security.Authentication.Web.
                    WebAuthenticationOptions.none, requestUri, callbackUri)
                .done(
                    result=>{
                        if (result.responseStatus == 0) {
                            complete(result.responseData.replace('https://localhost/oauth2callback?code=', ''));
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
        var buffer = [];

        // Serialize each key in the object.
        for (var name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            var value = data[name];
            if (!!encode) {
                buffer.push(`${encodeURIComponent(name)}=${encodeURIComponent((value == null) ? "" : value)}`);
            } else {
                buffer.push(`${name}=${value == null ? "" : value}`);
            }
        }
        // Serialize the buffer and clean it up for transportation.
        var source = buffer.join("&").replace(/%20/g, "+");
        return (source);
    }

})();