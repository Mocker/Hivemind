var yoxviewMedia = function(){
    this.loadMedia = function(provider, url, availableSize, onLoad, onError)
    {
        jQuery.jsonp({
            url: (providerUrls[provider] || "http://oohembed.com/oohembed/"),
            data: jQuery.extend({
                "url" : url,
                "format": "json"
            }, availableSize),
            dataType: 'jsonp',
            callbackParameter: "callback",
            success: function(data)
            {
                var media = {
                    title: data.title,
                    width: data.width,
                    height: data.height,
                    type: data.type
                };
                
                if (data.type === "video")
                {
                    media.html = data.html
                        .replace(/<embed /, "<embed wmode=\"transparent\" ")
                        .replace(/<param/, "<param name=\"wmode\" value=\"transparent\"><param")
                        .replace(/width=\"[\d]+\"/ig, "width=\"100%\"")
                        .replace(/height=\"[\d]+\"/ig, "height=\"100%\"");
                }
                else if (data.type === "photo")
                {
                    jQuery.extend(media, {
                        src: data.url,
                        alt: data.title,
                        type: "image"
                    });                     
                }
                onLoad(media);
            },
            error: function(errorSender, errorMsg){
                if (onError)
                    onError(errorSender, errorMsg);
            }
        });
    };

    var providerUrls = {
        vimeo: "http://vimeo.com/api/oembed.json",
        myspace: "http://vids.myspace.com/index.cfm?fuseaction=oembed"
    };
}