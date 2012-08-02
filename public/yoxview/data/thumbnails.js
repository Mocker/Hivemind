/*!
 * YoxView thumbnails reader
 * http://yoxigen.com/yoxview/
 *
 * Copyright (c) 2010 Yossi Kolesnicov
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: 1st April, 2010
 * Version : 1.2
 */
function yoxview_thumbnails()
{
    var $ = jQuery;
    var imageRegex = /.*\.(?:jpg|jpeg|gif|png)/i;
    var videoRegex = {
        youtube: /.*youtube.com\/watch.*(?:v=[^&]+).*/i,
        vimeo: /vimeo.com\/\d+/i,
        hulu: /hulu.com\/watch\//i,
        viddler: /viddler.com\//i,
        flickr: /.*flickr.com\/.*/i,
        myspace: /.*vids.myspace.com\/.*/i,
        qik: /qik.com/i,
        revision3: /revision3.com/i
    };
    
    this.getImagesData = function(container, options)
    {
        options = options || {};
        var thumbnails = container[0].tagName == "A" ? container : container.find("a:has(img)");
        var images = new Array();

        thumbnails.each(function(i, thumbnail){
            images.push(getImageDataFromThumbnail($(thumbnail), options));
        });

        container.yoxthumbs(jQuery.extend({}, 
            options.thumbnailsOptions || {}, 
            { 
                onClick: function(e){
                    if (options.thumbnailsOptions && options.thumbnailsOptions.onClick)
                        options.thumbnailsOptions.onClick(
                            $(e.currentTarget).data("yoxthumbs").imageIndex, 
                            $(e.currentTarget),
                            $(e.liveFired).data("yoxview").viewIndex);
                    else
                        yoxviewApi.openGallery($(e.liveFired).data("yoxview").viewIndex,
                            $(e.currentTarget).data("yoxthumbs").imageIndex);

                    return false;
                }
            }
        ));
        
        return images;
    }

    function getImageDataFromThumbnail(thumbnail, options)
    {
        var isVideo = false;
        
        var thumbImg = thumbnail.children("img:first");
        var imageData = {
            thumbnailImg : thumbImg,
            thumbnailSrc : thumbImg.attr("src")
        };
        var thumbnailHref = thumbnail.attr("href");
        
        if (thumbnailHref.match(imageRegex))
        {
            jQuery.extend(imageData, {
                media: {
                    src : thumbnail.attr("href"),
                    title : thumbImg.attr(options.titleAttribute),
                    alt : thumbImg.attr("alt")
                }
            });
        }
        else
        {
            for(videoProvider in videoRegex)
            {
                if (thumbnailHref.match(videoRegex[videoProvider]))
                {
                    jQuery.extend(imageData, {
                        media: {
                            type: "video",
                            provider: videoProvider,
                            url: thumbnailHref
                        }
                    });
                    isVideo = true;
                }
            }
        }
        return imageData;
    }
}