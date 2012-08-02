/*!
 * jquery.yoxthumbs v0.9
 * jQuery thumbnails plugin
 * http://yoxigen.com/
 *
 * Copyright (c) 2010 Yossi Kolesnicov
 *
 * Date: 25th April, 2010
 * Version : 0.9
 */
(function($){
    $.fn.yoxthumbs = function(opt) {
        if (typeof(opt) != 'string')
        {
            var defaults = {
                target: null, // an yoxview instance
                selectedThumbnailClassName : "selected",
                thumbsOpacityFadeTime: 300,
                thumbsOpacity : undefined,
                prevBtn: undefined,
                nextBtn: undefined,
                onClick: undefined,
                images: undefined
            };
            
            var options = $.extend(defaults, opt);
            var $this = $(this);
            $this.data("yoxthumbs", new YoxThumbs($this, options));
            return this;
        }
        else
        {
            var instance = $(this).data("yoxthumbs");
            if (instance)
            {
                if ($.isFunction(instance[opt]))
                    instance[opt].apply(instance, Array.prototype.slice.call(arguments, 1));
                else
                    return instance[opt];
            }
            return this;
        }
    };
    function YoxThumbs(container, options)
    {
        var self = this;
        var prevBtn = options.prevBtn;
        var nextBtn = options.nextBtn;
        var viewIndex = container.data("yoxview") ? container.data("yoxview").viewIndex : undefined;
        var $ = jQuery;

        // If images data has been specified, create the thumbnails:
        if (options.images)
        {
            jQuery.each(options.images, function(i, imageData){
                container.append(createThumbnail(imageData));
            });
        }

        this.thumbnails = container.find("a:has(img)");
        $.each(this.thumbnails, function(i, thumbnail)
        {
            $(thumbnail).data("yoxthumbs", {imageIndex: i});
        });

        if (options.thumbsOpacity)
        {
            this.thumbnails.css("opacity", options.thumbsOpacity);
            container.delegate("a:has(img)", "mouseenter", function(e){
                if (self.currentSelectedIndex === undefined || 
                    $(e.currentTarget).data("yoxthumbs").imageIndex != self.currentSelectedIndex){
                    $(e.currentTarget).stop().animate({opacity: 1}, options.thumbsOpacityFadeTime);
                }
            })
            .delegate("a:has(img)", "mouseout", function(e){
                if (self.currentSelectedIndex === undefined || 
                    $(e.currentTarget).data("yoxthumbs").imageIndex != self.currentSelectedIndex)
                    $(e.currentTarget).stop().animate({opacity: options.thumbsOpacity}, options.thumbsOpacityFadeTime);
            });
        }
        if (options.onClick)
        {
            container.delegate("a:has(img)", "click", function(e){
                options.onClick(e);
                return false;
            });
        }
        
        function createThumbnail(imageData, viewIndex)
        {
            var thumbnail = jQuery("<a>", {
                href: imageData.link
            });
            if (viewIndex)
                thumbnail.data("yoxview", {viewIndex : viewIndex});
                
            var thumbImage = jQuery("<img>", {
                src : imageData.thumbnailSrc,
                alt : imageData.media.alt,
                title : imageData.media.title
            })
            if (imageData.thumbnailDimensions)
                thumbImage.css({
                    "width": imageData.thumbnailDimensions.width,
                    "height" : imageData.thumbnailDimensions.height
                });
            thumbImage.appendTo(thumbnail);
            
            return thumbnail;
        }
        
        // Selects a thumbnail
        this.select = function(thumbIndex)
        {
            if (this.currentSelectedIndex === undefined || this.currentSelectedIndex != thumbIndex)
            {
                var currentThumbnail = this.thumbnails.eq(thumbIndex);
                var yoxslider = container.data("yoxslide");
                if (yoxslider)
                    yoxslider.show(currentThumbnail);

                // Remove selection from previous thumbnail:
                if (this.currentSelectedIndex !== undefined)
                {
                    var previousSelectedThumbnail = this.thumbnails.eq(this.currentSelectedIndex);
                    previousSelectedThumbnail.removeClass(options.selectedThumbnailClassName);
                    if (options.thumbsOpacity)
                        previousSelectedThumbnail.animate({opacity: options.thumbsOpacity}, options.thumbsOpacityFadeTime);
                        
                }
                
                currentThumbnail.addClass(options.selectedThumbnailClassName);
                if (options.thumbsOpacity)
                    currentThumbnail.animate({opacity: 1}, options.thumbsOpacityFadeTime);
                                        
                this.currentSelectedIndex = thumbIndex;
            }
        }
    }
})(jQuery);