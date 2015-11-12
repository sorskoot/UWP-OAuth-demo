(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {

            document.querySelector("#goButton").onclick = go;

            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.start();

    function go(e) {
        let oauth = new TimmyTools.oauth();

        oauth.connect().then(t => {

            getYouTubeActivities(t.access_token, 20).then(result=> {
                let resultList = document.querySelector("#resultList")
                    .winControl;
                let resultData = new WinJS.Binding.List(result.items);

                resultList.itemTemplate =
                    document.querySelector(".tileTemplate");
                resultList.itemDataSource = resultData.dataSource;
            });
        })

    }

    function getYouTubeActivities(token, maxResults) {
        let headers = {
            Authorization: `Bearer ${token}`
        };
        let url = `${youtubeConfig.base_url}activities?part=snippet%2C+contentDetails&mine=true&maxResults=${maxResults}&key=${youtubeConfig.key}`

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(x=>JSON.parse(x.response));
    };
    WinJS.Namespace.define("TimmyTools", {
        toUrl: WinJS.Binding.converter(function (url) {
            return `url('${url}')`;
        })
    });

})();
