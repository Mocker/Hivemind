/*!
 * YoxView Picasa plugin
 * http://yoxigen.com/yoxview/
 *
 * Copyright (c) 2010 Yossi Kolesnicov
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: 19th April, 2010
 * Version : 1.21
 */
function yoxview_picasa()
{
    var $ = jQuery;
    this.getImagesData = function(container, _options, dataOptions)
    {
        var defaults = {
            url: "http://picasaweb.google.com/data/feed/api/user/",
            setThumbnail: true,
            setSingleAlbumThumbnails: true,
            setTitle: true // Whether to add a header with user and/or album name before thumbnails
        };

        var options = jQuery.extend({}, defaults, dataOptions.dataSourceOptions);
        
        if (options.album == "")
            options.album = null;
            
        if (options.imagesMaxSize)
            options.imagesMaxSize = picasa_getMaxSize(options.imagesMaxSize, picasaImgMaxSizes);

        var screenSize = screen.width > screen.height ? screen.width : screen.height;
        
        // Save resources for smaller screens:
        if (!options.imagesMaxSize || screenSize < options.imagesMaxSize)
            options.imagesMaxSize = picasa_getMaxSize(screenSize, picasaImgMaxSizes);

        if (options.thumbnailsMaxSize)
            options.thumbnailsMaxSize = picasa_getMaxSize(options.thumbnailsMaxSize, picasaThumbnailSizes);

        var feedUrl = getFeedUrl(options);
        
        var images = new Array();
        var _viewIndex = container.data("yoxview").viewIndex;
        
        // Load an album:
        if (options.album)
        {
            if (dataOptions.onLoadBegin)
                dataOptions.onLoadBegin();
                
            $.jsonp({
                url: feedUrl,
                async: false,
                dataType: 'jsonp',
                callbackParameter: "callback",
                success: function(data)
                {
                    var thumbnail;
                    var thumbnailData = data.feed;
                    var albumTitle = thumbnailData.title.$t;
                    
                    picasa_getImagesDataFromJson(data, thumbnail, images);

                    if (images.length != 0 && options.setThumbnail)
                    {
                        // Display the album as a single thumbnail that opens all the images:
                        if (!options.setSingleAlbumThumbnails)
                        {
                            var albumImageData = new Array();
                            albumImageData.push({
                                link: thumbnailData.link[1].href,
                                thumbnailImg: thumbnailData.icon.$t,
                                media: {
                                    title: albumTitle + " (" + thumbnailData.gphoto$numphotos.$t + " images)",
                                    alt: albumtitle
                                }
                            });
                            container.yoxthumbs({ images: albumImageData, onClick: function(e){
                                yoxviewApi.thumbnail = $(e.currentTarget);
                                yoxviewApi.openGallery($(e.liveFired).data("yoxview").viewIndex,
                                $(e.currentTarget).data("yoxthumbs").imageIndex);
                                    return false;
                                }
                            });
                        }
                        else // create thumbnails for all the images in the album:
                        {
                            container.addClass("yoxview-thumbnails");
                            
                            if (options.setTitle)
                            {
                                var albumDetails = $("<div>", {
                                    className : "yoxview-thumbnails-details"
                                });
                                
                                var authorData = data.feed.author[0];
                                
                                albumDetails.append(
                                    "<h2>" + albumTitle + "</h2>",
                                    "By ",
                                    "<a href='" + authorData.uri.$t + "' title=\"Go to " + authorData.name.$t + "'s Picasa page\" target='_blank'>" + authorData.name.$t + "</a>",
                                    "<div style='clear:both;'></div>"
                                )
                                .prependTo(container);
                            }
                            container.yoxthumbs({ images: images, onClick: function(e){
                                yoxviewApi.openGallery($(e.liveFired).data("yoxview").viewIndex,
                                $(e.currentTarget).data("yoxthumbs").imageIndex);
                                    return false;
                                }
                            });
                        }
                    }
                    if (dataOptions.onLoadComplete)
                        dataOptions.onLoadComplete();
                },
                error : function(xOptions, textStatus){
                    if (dataOptions.onLoadError)
                        dataOptions.onLoadError("Album '" + options.album + "' for user '" + options.user + "' not found.");
                }
            });
        }
        // Load multiple albums:
        else
        {
            var thumbnailsWithAlbums = 0;
            var picasaRegex = /http:\/\/picasaweb.google.*\/([^\/]+)\/([^\?]+).*/;
            
            var containerIsThumbnail = container[0].tagName == "A";
            var albumThumbnails = containerIsThumbnail ? container : container.find("a:has(img)");
            
            albumThumbnails.each(function(){
                var thumbnail = $(this);
                var urlMatch = this.href.match(picasaRegex);
                if (urlMatch)
                {
                    var picasaInfo = { user : urlMatch[1], album : urlMatch[2] };
                    var thumbnailData = thumbnail.data("yoxview");
                    
                    if (thumbnailData)
                        jQuery.extend(thumbnailData, picasaInfo);
                    else
                        thumbnail.data("yoxview", picasaInfo);
                    
                    var viewData = containerIsThumbnail ? thumbnail.data("yoxview") : thumbnail.parent().data("yoxview");
                    
                    thumbnail.bind("click.yoxview", function(){
                        var thumbnailData = $(this).data("yoxview");
                        
                        if (!viewData.imagesAreSet)
                        {
                            thumbnail.css("cursor", "wait");

                            $.ajax({
                                url: getFeedUrl(jQuery.extend({}, options, thumbnailData)),
                                dataType: 'jsonp',
                                success: function(data)
                                {
                                    var imagesData = new Array();
                                    picasa_getImagesDataFromJson(data, thumbnail, imagesData);
                                    viewData.images = imagesData;
                                    viewData.imagesAreSet = true;
                                    thumbnail.css("cursor", "");
                                    yoxviewApi.openGallery(viewData.viewIndex);
                                }
                            });
                        }
                        else
                            yoxviewApi.openGallery(
                                containerIsThumbnail
                                ? thumbnail.data("yoxview").viewIndex
                                : thumbnail.parent().data("yoxview").viewIndex);

                        return false;
                    });
                    thumbnailsWithAlbums++;
                }
            });
            
            if (thumbnailsWithAlbums == 0)
            {
                if (dataOptions.onLoadBegin)
                    dataOptions.onLoadBegin();

                $.jsonp({
                    url: feedUrl,
                    dataType: 'jsonp',
                    callbackParameter: "callback",
                    success: function(data)
                    {
                        if (!data.feed.entry)
                        {
                            if (dataOptions.onNoData)
                                dataOptions.onNoData();
                                
                            return;
                        }

                        if (options.setTitle)
                        {
                            var authorData = data.feed.author[0];
                            var albumDetails = $("<div>", {
                                className : "yoxview-thumbnails-details"
                            });
                            
                            albumDetails.append(
                                "<h2><a href='" + authorData.uri.$t + "' target='_blank' title=\"Go to " + authorData.name.$t + "'s gallery in Picasa\">" + authorData.name.$t + "</a>'s gallery</h2>",
                                "<div style='clear:both;'></div>"
                            )
                            .prependTo(container);
                        }

                        var imagesData = new Array();
                        
                        jQuery.each(data.feed.entry, function(i, album){
                    
                            if (album.gphoto$numphotos.$t != '0')
                            {
                                var imageData = {
                                    thumbnailSrc: album.media$group.media$thumbnail[0].url,
                                    thumbnailDimensions: { 
                                        width: album.media$group.media$thumbnail[0].width,
                                        height: album.media$group.media$thumbnail[0].height
                                    },
                                    link: album.link[1].href,
                                    media: {
                                        title: album.title.$t + " (" + album.gphoto$numphotos.$t + " images)",
                                        alt: album.title.$t
                                    }
                                };
                                
                                imagesData.push(imageData);
                            }
                        });
                        
                        container.yoxthumbs({ images: imagesData });
                        container.yoxthumbs('thumbnails').yoxview(_options, dataOptions);

                        if (dataOptions.onLoadComplete)
                            dataOptions.onLoadComplete();
                    },
                    error : function(xOptions, textStatus){
                        if (dataOptions.onLoadError)
                            dataOptions.onLoadError("User '" + options.user + "' not found.");
                    }
                });   
            }
        }

        return images;
    }

    var picasaThumbnailSizes = [32, 48, 64, 72, 104, 144, 150, 160];
    var picasaImgMaxSizes = [94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600];

    function getFeedUrl(options)
    {
        var feedUrl = options.url + options.user;
        
        if (options.album)
            feedUrl += "/album/" + options.album;
            
        feedUrl += "?imgmax=" + options.imagesMaxSize + "&alt=json";
        
        if (options.thumbnailsMaxSize)
            feedUrl += "&thumbsize=" + options.thumbnailsMaxSize;

        if (options.authkey)
            feedUrl += "&authkey=" + options.authkey;
            
        return feedUrl;
    }
    function picasa_getMaxSize(size, sizesArray)
    {
        for(var i=sizesArray.length; i >= 0; i--)
        {
            size = parseInt(size);
            var pSize = sizesArray[i];
            if (size >= pSize)
                return pSize;
        }
        
        return size;
    }
    function picasa_getImagesDataFromJson(data, thumbnail, imagesData)
    {
        jQuery.each(data.feed.entry, function(i, image){
            var imageTitle = image.summary.$t;
            var imageData = {
                thumbnailSrc : image.media$group.media$thumbnail[0].url,
                link: image.link[1].href,
                thumbnailImg: thumbnail ? thumbnail.children("img:first") : null,
                media: {
                    src: image.content.src,
                    title: imageTitle,
                    alt: imageTitle
                }
            };

            imagesData.push(imageData);
        });
    }
}