/*!
 * jquery.yoxview v1.8
 * jQuery image gallery viewer
 * http://yoxigen.com/yoxview
 *
 * Copyright (c) 2010 Yossi Kolesnicov
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: 25th April, 2010
 * Version : 1.8
 */ 

var yoxviewApi;

(function($){
    var yoxviewCreated = false;  
    var yoxviewPath;
    
    $.yoxviewUnload = function()
    {
        if (yoxviewApi)
        {
            yoxviewApi.unload();
            delete yoxviewApi;
        }
    }
    $(window).unload(function(){
        $.yoxviewUnload();
    });
    
    $.fn.yoxviewUnload = function()
    {
        jQuery.each(this, function(i, view){
            $(view).find("a:has(img)").unbind("click.yoxview")
        });
        
        return this;
    }
    $.fn.yoxview = function(opt, _dataOptions) {
        if (this.length == 0)
            return this;

        if (!yoxviewPath)
            yoxviewPath = typeof(_yoxviewPath) != "undefined" ? _yoxviewPath : getYoxviewPath();

         // Load the language file if not already loaded:
        this.loadLanguage = function(lang, callBack)
        { 
            var self = this;
            if (!yoxviewLanguages[lang])
            {
                yoxviewLanguages[lang] = {};
                $.ajax({
                    url : yoxviewPath + "lang/" + lang + ".js",
                    async : false,
                    dataType : "json",
                    success: function(data){
                        yoxviewLanguages[lang] = data;
                        self.loadDataSource(dataOptions.dataSource, callBack);
                    }
                });
            }
            else
                self.loadDataSource(dataOptions.dataSource, callBack);
        }
        this.loadDataSource = function(dataSourceName, callBack)
        {
            var self = this;
            if (!yoxviewDataSources[dataSourceName])
            {
                $.ajax({
                    url : options.dataFolder + dataSourceName + ".js", 
                    async : false,
                    dataType : "script",
                    success: function(data){
                        eval(data);
                        eval ("yoxviewDataSources['" + dataSourceName + "'] = new yoxview_" + dataSourceName + "();");                      
                        callBack(self);
                    },
                    error : function(XMLHttpRequest, textStatus, errorThrown)
                    {
                        console.log(XMLHttpRequest, textStatus, errorThrown);
                    }
                });
            }
            else
                callBack(self);
        }
        var defaults = {
            backgroundColor : "#000",
            backgroundOpacity : 0.8,
            playDelay : 3000, // Time in milliseconds to display each image
            popupMargin : 20, // the minimum margin between the popup and the window
            infoBackOpacity : 0.5,
            infoBackColor : "Black",
            imagesFolder : yoxviewPath + "images/",
            dataFolder : yoxviewPath + "data/",
            langFolder : yoxviewPath + "lang/",
            cacheImagesInBackground : true, // If true, full-size images are cached even while the gallery hasn't been opened yet.
            displayImageTitleByDefault : true, // If true, the image title is always displayed. If false, it's only displayed if hovered on.
            titleDisplayDuration : 2000, // The time in ms to display the image's title, after which it fades out.
            titlePadding : 6, // Padding in pixels for the image's title
            buttonsFadeTime : 500, // The time, in milliseconds, it takes the buttons to fade in/out. Set to 0 to force the Prev/Next buttons to remain visible.
            loopPlay : true, // If true, slideshow play starts over after the last image
            isRTL : false, // Switch direction. For RTL languages such as Hebrew or Arabic, for example.
            lang : "en", // The language for texts. The relevant language file should exist in the /lang folder.
            titleAttribute : "title",
            autoPlay : false, // If true, slideshow mode starts when the popup opens
            showBarsOnOpen : true, // If true, displays the top (help) bar and bottom (info) bar momentarily when the popup opens.
            showButtonsOnOpen : true, // If true, displays the Prev/Next buttons momentarily when the popup opens.
            renderButtons: true, // Set to false if you want to implement your own Next/Prev buttons, using the API.
            renderMenu: true // Set to false if you want to implement you own menu (Play/Help/Close).
        };
        
        var dataDefaults = {
            dataSource : "thumbnails",
            dataSourceOptions : {}
        };
        var options = $.extend(defaults, opt); 
        var dataOptions = $.extend(dataDefaults, _dataOptions);

        if (!yoxviewCreated)
        {
            yoxviewCreated = true;
            this.loadLanguage(options.lang, function(views){
                yoxviewApi = new YoxView(views, options, dataOptions);
            });
        }
        else
        {
            this.loadLanguage(options.lang, function(views){
                yoxviewApi.AddViews(views, options, dataOptions);
            });
        }   

        return this;
    };
})(jQuery);

function ImageDimensions(widthV, heightV)
{
    this.Width = widthV;
    this.Height = heightV;
}

var yoxviewLanguages = new Array();
var yoxviewDataSources = new Array();

function YoxView(_views, _options, _dataOptions)
{  
    var yoxviewApi = this;
    var defaultOptions = _options;
    var options = defaultOptions;
    var dataOptions = _dataOptions;
    var currentLanguage = {};
    var views = new Array();
    var currentViewIndex = 0;
    var images;
    var imagesCount = 0;
    var popup;
    var currentItemIndex = 0;
    var currentImage;
    var thumbnail;
    var thumbnailImg;
    var thumbnailPos;
    var thumbnailProperties;
    var firstImage = true;
    var image1;
    var image2;
	var panel1;
	var panel2;
    var itemVar;
    var prevBtn;
    var nextBtn;
    var ajaxLoader;
    var helpPanel;
    var popupInfo;
    var popupInfoTitle;
    var popupInfoTitleMinHeight = 28 - 2*options.titlePadding;
    var popupInfoBack;
    var popupBars;
    var ctlButtons; // next and prev buttons
    var popupBackground;
    var countDisplay;
    var isPlaying = false;
    var resumePlay = false;
    var notifications = new Array();
    var tempImg = new Image();
    var cacheImg = new Image();
    var currentCacheImg = 0;
    var cachedImages;
    this.isOpen = false;
    var isResizing = false;
    var firstViewWithImages;
    var loading = false;
    var onOpenCallback;
    var mediaLoader;
    var mediaButtonsSize = {width: 100, height: 100};
    var $ = jQuery; // Ensure the dollar sign stands for jQuery, in case other JS libraries are loaded, that use it.
    var keyCodes = {
	    40: 'DOWN',
	    35: 'END',
	    13: 'ENTER',
	    36: 'HOME',
	    37: 'LEFT',
	    39: 'RIGHT',
	    32: 'SPACE',
	    38: 'UP',
	    72: 'h',
	    27: 'ESCAPE'
    };
    var keyMappings = {
        RIGHT: options.isRTL ? 'prev' : 'next',
        DOWN: 'next',
        UP: 'prev',
        LEFT: options.isRTL ? 'next' : 'prev',
        ENTER: 'play',
        HOME: 'first',
        END: 'last',
        SPACE: 'next',
        h: 'help',
        ESCAPE: 'close'
    };
    
    this.AddViews = function(_views, options, _dataOptions)
    {
        var popupIsCreated = firstViewWithImages != undefined;
        
        jQuery.each(_views, function(){
            setView(this, views.length, options, _dataOptions);
            views.push(this);
            if (!firstViewWithImages)
            { 
                var viewImages =  $(this).data("yoxview").images;
                if (viewImages && viewImages.length != 0)
                    firstViewWithImages = this;
            }
        });

        if (!popupIsCreated && firstViewWithImages)
        {
            loadViewImages(firstViewWithImages);
            createPopup();

            if(options.cacheImagesInBackground && imagesCount != 0)
                cacheImages(0);

            popupIsCreated = true;
        }
    }
    this.SetImages = function(_images)
    {
        images = _images;
        imagesCount = images.length;
    }
    function resetPopup()
    {
        if (popup)
        {
            popup.parent().remove();
            popup = undefined;
            prevBtn = undefined;
            nextBtn = undefined;
            image1 = undefined;
            image2 = undefined;
			panel1 = undefined;
			panel2 = undefined;
            currentItemIndex = 0;
            currentCacheImg = 0;
        }
        createPopup();
    }
    function loadViewImages(_view)
    {
        var viewData = $(_view).data("yoxview");
        if (!images || currentViewIndex != viewData.viewIndex)
        {
            images = viewData.images;
            imagesCount = images.length;
            currentViewIndex = viewData.viewIndex;

            var isResetPopup = false;

            if (viewData.options && !compare(options, viewData.options))
            {
                options = viewData.options;
                isResetPopup = true;
            }
            else if (!viewData.options && !compare(options, defaultOptions))
            {
                options = defaultOptions;
                isResetPopup = true;
            }
            else if ((prevBtn && imagesCount == 1) || (popup && !prevBtn && imagesCount > 0))
                isResetPopup = true;

            if (isResetPopup)
                resetPopup();
        }
    }
    
    function setView(view, viewIndex, _options, dataOptions)
    {
        var view = $(view);
        view.data("yoxview", {viewIndex : viewIndex});
        
        var viewImages;

        if (dataOptions.images != null)
        {
            viewImages = dataOptions.images;
            thumbnail = $(view.find("a:has(img)")[0]);
            thumbnail.data("yoxview", { viewIndex : viewIndex })
            .bind("click.yoxview", function(){
                yoxviewApi.openGallery($(this).data("yoxview").viewIndex);
                return false;
            });
        }
        else
            viewImages = yoxviewDataSources[dataOptions.dataSource].getImagesData(view, _options, dataOptions);

        view.data("yoxview").images = viewImages;
        if (_options != options)
            view.data("yoxview").options = _options;
    }

    function setThumbnail(setToPopupImage)
    {
        var currentView = $(views[currentViewIndex]);
        thumbnail = currentView[0].tagName == "A"
            ? currentView
            : currentView.yoxthumbs('thumbnails').eq(currentItemIndex);
          
        var thumbnailImg = thumbnail.children("img:first");
        if (thumbnailImg)
        {
            if (setToPopupImage && image1)
                image1.attr("src", thumbnailImg.attr("src"));

            thumbnailPos = thumbnailImg.offset();
            thumbnailProperties = {
                width: thumbnailImg.width(), 
                height: thumbnailImg.height(), 
                top: thumbnailPos.top - $(window).scrollTop(), 
                left: thumbnailPos.left 
            };
        }
    }
    
//    Opens the viewer popup.
//    Arguments:
//    viewIndex: The 0-based index of the view to open, in case there are multiple instances of YoxView on the same page. Default is 0.
//    imageIndex: The 0-based index of the image to open, in the specified view. Default is 0.
//    callBack: A function to call after the gallery has opened.
    this.openGallery = function(viewIndex, initialItemIndex, callBack)
    {
        if (typeof(viewIndex) == 'function')
        {
            callBack = viewIndex;
            viewIndex = initialItemIndex = 0;
        }
        else if (typeof(initialItemIndex) == 'function')
        {
            callBack = initialItemIndex;
            initialItemIndex = 0;
        }
        viewIndex = viewIndex || 0;
        initialItemIndex = initialItemIndex || 0;
        
        loadViewImages(views[viewIndex]);

        if (!popup && imagesCount != 0)
            createPopup();

        if(options.cacheImagesInBackground)
            cacheImages(initialItemIndex);

        this.selectImage(initialItemIndex);
        popup.parent().stop().fadeIn("slow");

        if (callBack)
            onOpenCallback = callBack;

        return false;
    }

    this.selectImage = function(itemIndex)
    {
        currentImage = images[itemIndex];
        currentItemIndex = itemIndex;
        
        setThumbnail(true);
        thumbnail.blur();

        panel1.css({
            "z-index" : "1",
            "width" : thumbnailProperties.width, 
            "height" : thumbnailProperties.height
        });
        panel2.css({
            "display" : "none",
            "z-index" : "2"
        });
        
        firstImage = true;

        popup.css({
            "width" : thumbnailProperties.width,
            "height" : thumbnailProperties.height,
            "top" : thumbnailProperties.top,
            "left" : thumbnailProperties.left
        });
        this.select(itemIndex);
        this.isOpen = true;
    }
    this.refresh = function()
    {
        resumePlay = isPlaying;

        if (isPlaying)
            stopPlay();

        setImage(currentItemIndex);
        
        if (resumePlay)
            startPlay();
    }
    
//    Displays the specified image and shows the specified button, if specified. Use when the viewer is open.
//    Arguments:
//    imageIndex: The 0-based index of the image to display.
//    pressedBtn: a jQuery element of a button to display momentarily in the viewer. 
//                For example, if the image has been selected by pressing the Next button 
//                on the keyboard, specify the Next button. If no button should be display, leave blank.
    this.select = function(itemIndex, pressedBtn, viewIndex)
    {
        if (typeof pressedBtn === "number")
        {
            viewIndex = pressedBtn;
            pressedBtn = undefined;
        }
        viewIndex = viewIndex || 0;
        
        if (!isResizing)
        {
            if (itemIndex < 0)
                itemIndex = imagesCount - 1;
            else if (itemIndex == imagesCount)
                itemIndex = 0;

            if (!isPlaying && pressedBtn)
                flicker(pressedBtn);
                
            currentImage = images[itemIndex];
            currentItemIndex = itemIndex;
            setImage(currentItemIndex);
            
            // Handle event onSelect:
            if (options.onSelect)
                options.onSelect(itemIndex);
        }
    }
    this.prev = function()
    {
        this.select(currentItemIndex - 1, prevBtn);
        return false;
    }
    this.next = function()
    {
        this.select(currentItemIndex + 1, nextBtn);
        return false;
    }
    this.first = function()
    {
        longFlicker(notifications["first"]);
        this.select(0);
        return false;
    }
    this.last = function()
    {
        longFlicker(notifications["last"]);
        this.select(imagesCount - 1);
        return false;
    }
    this.play = function()
    {
        if (imagesCount == 1)
            return;
            
        if (!isPlaying)
        {
            longFlicker(notifications["play"]);
            startPlay();
        }
        else
        {
            longFlicker(notifications["pause"]);
            stopPlay();
        }
    }
    function flicker(button)
    {
        if (button.css("opacity") == 0)
        {
            button.stop().animate({ opacity : 0 }, options.buttonsFadeTime, fadeOut(button));
        }
    }
    function longFlicker(button)
    {
        button.stop().fadeIn(options.buttonsFadeTime).oneTime(1000, function(){
                $(this).stop().fadeOut(options.buttonsFadeTime);
            });
    }
    function fadeIn(button)
    {
        $(button).stop().animate({ opacity : 0 }, options.buttonsFadeTime);
    }
    function fadeOut(button)
    {
        $(button).stop().animate({ opacity : 0.5 }, options.buttonsFadeTime);
    }

    this.close = function()
    {
        this.closeHelp();
        setThumbnail(false);
        resizePopup(thumbnailProperties.width, thumbnailProperties.height, thumbnailProperties.top, thumbnailProperties.left);
        popupBackground.animate({ opacity: 0}, "slow");
        newPanel.animate({
            width: thumbnailProperties.width,
            height: thumbnailProperties.height,
            opacity: 0
        }, "slow", function(){
            popup.parent().stop().fadeOut("slow", function(){
                newPanel.css("opacity", 1);
                popupBackground.css("opacity", options.backgroundOpacity);
            });
        });
        popupBars.css("display", "none");
        if (options.onClose)
            options.onClose();
            
        this.isOpen = false;
        isResizing = false;
    }
    this.help = function()
    {
        if (this.isOpen)
        {
            if (helpPanel.css("display") == "none")
                helpPanel.css("display", "block").stop().animate({ opacity : 0.8 }, options.buttonsFadeTime);
            else
                this.closeHelp();
        }
    }
    this.closeHelp = function()
    {
        if (helpPanel.css("display") != "none")
        helpPanel.stop().animate({ opacity: 0 }, options.buttonsFadeTime, function(){
                helpPanel.css("display", "none");
            });
    }
    this.clickBtn = function(fn, stopPlaying)
    {
        if (stopPlaying && isPlaying)
            stopPlay();
            
        fn.call(this);
        return false;
    }
    
    function catchPress(e)
    {
        if (yoxviewApi && yoxviewApi.isOpen)
        {
            var pK = keyCodes[e.keyCode];
            var calledFunction = yoxviewApi[keyMappings[pK]];
            if (calledFunction)
            {
                e.preventDefault();
                calledFunction.apply(yoxviewApi);
                return false;
            }
            return true;
        }
        return true;
    }
    
    function createMenuButton(_imageSrc, _title, btnFunction, stopPlay)
    {
        var btn = $("<a>", {
            href : "#",
            click : function(){
                return yoxviewApi.clickBtn(btnFunction, stopPlay);
            }         
        });
        var btnSpan = $("<span>" + _title + "</span>");
        btnSpan.css("opacity", "0")
        .appendTo(btn);
        
        btn.append(createImage(_imageSrc, _title, "18", "16"))
        .hover( 
            function(){ $(this).stop().animate({ top : "8px" }, "fast").find("span").stop().animate({opacity:1}, "fast") },
            function(){ $(this).stop().animate({ top : "0" }, "fast").find("span").stop().animate({opacity:0}, "fast") }
        );

        return btn;
    }
    
    function createNavButton(_function, _side, _title)
    {      
        var navBtnImg = new Image();
        navBtnImg.src = options.imagesFolder + _side + ".png";
        var navBtn = $("<a>", {
            css : {
                "background" : "url(" + navBtnImg.src + ") no-repeat " + _side + " center",
                "opacity" : "0",
                "outline" : "0"
            },
            className : "yoxview_ctlBtn",
            title : _title,
            href : "#",
            click : function(){
                this.blur();
                return yoxviewApi.clickBtn(_function, true);
            }
        });
        navBtn.css(_side, "0");
        return navBtn; 
    }
    
    // INIT:

    this.AddViews(_views, options, _dataOptions);
    
    $(document).delegate('*', 'keydown', function(data){
        catchPress(data);
    });
    $(window).bind("resize.yoxview", function()
    {
        //$(window).unbind("resize.yoxview");
        
        if (yoxviewApi.isOpen)
            yoxviewApi.resize();
            
        //$(window).bind("resize.yoxview", arguments.callee);
    });
        
    function createPopup()
    {
        currentLanguage = yoxviewLanguages[options.lang];

        popup = $("<div>", {
            id : 'yoxview'
        });
        popup.appendTo($(parent.document.body));
        
		panel1 = $("<div>", {
			className: "yoxview_imgPanel",
			css: {
				"z-index": "2"
			}
		});
		panel2 = $("<div>", {
			className: "yoxview_imgPanel",
			css: {
				"z-index": "1",
				"display": "none"
			}
		});
        // the first image:
        image1 = $("<img />", {
            className : "yoxview_fadeImg",
            css : {
				"display" : "block",
				"width" : "100%",
				"height" : "100%"
			}
        });

        // the second image:
        image2 = $("<img />", {
            className : "yoxview_fadeImg",
            css : {
				"display" : "block",
				"width" : "100%",
				"height" : "100%"
			}
        });
        panel1.data("yoxviewPanel", {image: image1})
		.append(image1).appendTo(popup);
		panel2.data("yoxviewPanel", {image: image2})
		panel2.append(image2).appendTo(popup);
        var singleImage = imagesCount == 1;
        
        // the menu:
        if (options.renderMenu !== false)
        {
            var popupMenuPanel = $("<div>", {
                id : "yoxview_popupMenuPanel",
                className : "yoxview_popupBarPanel yoxview_top",
                css : {"opacity" : "0" }
            });

            var popupMenu = $("<div>", {
                id : "yoxview_popupMenu",
                className : "yoxview_popupBar",
                css : { "opacity" : "0.8" }
            });
            
            var popupMenuBackImg = new Image();
            popupMenuBackImg.src = options.imagesFolder + "menu_back.png";
            
            var helpBtn = createMenuButton("help.png", currentLanguage.Help, yoxviewApi.help, false);
            var playBtn = createMenuButton("play.png", currentLanguage.Slideshow, yoxviewApi.play, false);
            
            popupMenu.append(
                createMenuButton("close.png", currentLanguage.Close, yoxviewApi.close, true),
                helpBtn,
                playBtn
            );
            
            if (singleImage)
            {
                playBtn.css("display", "none");
                helpBtn.css("display", "none");
                popupMenu.css("background-position", "95px 0");
            }
            popupMenu.find("a:last-child").attr("class", "last");
            popupMenuPanel.append(popupMenu).appendTo(popup);
        }
        
        if (options.renderButtons !== false && !singleImage)
        {
            // prev and next buttons:            
            prevBtn = createNavButton(yoxviewApi.prev, options.isRTL ? "right" : "left", currentLanguage.PrevImage);
            prevBtn.appendTo(popup);
            
            nextBtn = createNavButton(yoxviewApi.next, options.isRTL ? "left" : "right", currentLanguage.NextImage);
            nextBtn.appendTo(popup);
        }

        ctlButtons = popup.find(".yoxview_ctlBtn");

        // add the ajax loader:
        ajaxLoader = $("<div>", {
            id : "yoxview_ajaxLoader",
            className : "yoxview_notification",
            css : { "display" : "none" }
        });
        ajaxLoader.append(createImage("popup_ajax_loader.gif", currentLanguage.Loading, "32", "32"))
        .appendTo(popup);
        
        // notification images:
        var notificationsNames = ["play", "pause", "first", "last"];
        jQuery.each(notificationsNames, function(){
            var notification = $("<img />", {
                className : "yoxview_notification",
                alt : this,
                src : options.imagesFolder + "popup_" + this + ".png",
                css : { "display" : "none" }
            });
            notification.appendTo(popup);
            notifications[this] = notification;
        });
        
        // help:
        helpPanel = $("<div>", {
            id : "yoxview_helpPanel", 
            href : "#", 
            title : currentLanguage.CloseHelp,
            css : {
                "background" : "url(" + options.imagesFolder + "help_panel.png) no-repeat center top",
                "direction" : currentLanguage.Direction,
                "opacity" : "0"
            },
            click : function(){
                return yoxviewApi.clickBtn(yoxviewApi.help, false);
            }
        });
        
        var helpTitle = document.createElement("h1");
        helpTitle.innerHTML = currentLanguage.Help.toUpperCase();

        var helpText = document.createElement("p");
        helpText.innerHTML = currentLanguage.HelpText;
        
        var closeHelp = document.createElement("span");
        closeHelp.id = "yoxview_closeHelp";
        closeHelp.innerHTML = currentLanguage.CloseHelp;
        
        helpPanel.append(helpTitle).append(helpText).append(closeHelp).appendTo(popup);
        
        // popup info:
        popupInfo = $("<div>", {
            id : "yoxview_popupInfo",
            className : "yoxview_popupBarPanel yoxview_bottom"
        });

        popupInfoBack = $("<div>", {
            className : "yoxview_popupBar yoxview_bottom",
            css : {
                "background" : options.infoBackColor,
                "opacity" : options.infoBackOpacity,
                "z-index" : "1",
                "padding" : options.titlePadding + "px 0",
                "min-height" : popupInfoTitleMinHeight
            }
        });
        popupInfoBack.appendTo(popupInfo);
        
        popupInfoTitle = $("<h1>", {
            className : "yoxview_popupBar",
            css : {
                "z-index" : "2", 
                "bottom" : options.titlePadding, 
                "opacity" : "1" 
            }
        });
        popupInfoTitle.appendTo(popupInfo);
        
        countDisplay = $("<span>", {
            css : {"opacity" : "1"}
        });
        countDisplay.appendTo(popupInfo);
        popup.append(popupInfo);
        
        // wrap for the popup and the background:
        var popupWrap = $("<div>", {
            id : "yoxview_popupWrap",
            css : {
                "position" : "fixed",
                "top" : "0",
                "left" : "0",
                "width" : "100%",
                "height" : "100%",
                "display" : "none",
                "z-index" : "100"
            }
        });
        popup.wrap(popupWrap);

        // set the background:
        popupBackground = $("<div>", {
            css : {
                "position" : "fixed",
                "height" : "100%",
                "width" : "100%",
                "top" : "0",
                "left" : "0",
                "background" : options.backgroundColor,
                "z-index" : "1",
                "opacity" : options.backgroundOpacity
            },
            click : function(){  
                return yoxviewApi.clickBtn(yoxviewApi.close, true);
            }  
        }).appendTo(popup.parent());

        if (options.buttonsFadeTime != 0)
        {
            ctlButtons.hover(
                function(){ 
                    $(this).stop().animate({ opacity : 0.5 }, options.buttonsFadeTime);
                },
                function(){
                    $(this).stop().animate({ opacity : 0 }, options.buttonsFadeTime);
                }
            );
        }
        popupBars = popup.children(".yoxview_popupBarPanel");
        
        popupBars.hover(
            function(){
                var $this = $(this);
                if (!$this.data("disabled"))
                    $this.stop().animate({opacity : 1}, options.buttonsFadeTime);
            },
            function(){
                var $this = $(this);
                if (!$this.data("disabled"))
                    $(this).stop().animate({opacity : 0}, options.buttonsFadeTime);
            }
        );
    }
    
    $(cacheImg).load(function()
    {
        $.extend(images[currentCacheImg].media, {
            width: this.width,
            height: this.height,
            loaded: true
        });
        if (currentCacheImg < imagesCount - 1)
            cacheImages(currentCacheImg + 1);
    });
    function cacheImages(imageIndexToCache)
    {
        if (imageIndexToCache == imagesCount)
            imageIndexToCache = 0;
            
        var image = images[imageIndexToCache].media;
        if (!image.loaded)
        {
            currentCacheImg = imageIndexToCache;
            if (!image.type || image.type === "image")
                cacheImg.src = image.src;
            else
                loadMedia(image, function(){
                    cacheImages(currentCacheImg + 1);
                });
        }
        else
        {
            // First, try to cache forward:
            var nextImageToCache = imageIndexToCache + 1;
            if (nextImageToCache == imagesCount)
                nextImageToCache = 0;

            if (!images[nextImageToCache].media.loaded)
                cacheImages(nextImageToCache);
            else // Then, if forward is already cached, try to cache backwards:
            {
                nextImageToCache = imageIndexToCache - 1;
                if (nextImageToCache < 0)
                    nextImageToCache = imagesCount - 1;
                
                if (!images[nextImageToCache].media.loaded)
                cacheImages(nextImageToCache);
            }
        }
    }
    function createImage(_src, _alt, _width, _height)
    {
        var theImg = document.createElement("img");
        $(theImg).attr({
            "src" : options.imagesFolder + _src,
            "alt" : _alt,
            "width" : _width,
            "height" : _height
        });
        
        return theImg;
    }
    
    function showLoaderIcon()
    {
        loading = true;
        ajaxLoader.stop().stopTime()
        .oneTime(options.buttonsFadeTime, function()
        {
            $(this).stop().fadeIn(options.buttonsFadeTime);
        });
    }

    function hideLoaderIcon()
    {
        loading = false;
        ajaxLoader.stop().stopTime().fadeOut(options.buttonsFadeTime);
    }

    function setImage(itemIndex)
    {
        if (!isPlaying)
        {
            showLoaderIcon();
        }
        loadAndDisplayMedia(currentImage.media);
    }
    
    function fitImageSize(imageWidth, imageHeight, targetWidth, targetHeight)
    {
        var resultSize = new ImageDimensions(imageWidth, imageHeight);
        if (imageWidth > targetWidth)
        {
            resultSize.Height = Math.round((targetWidth / imageWidth) * imageHeight);
            resultSize.Width = targetWidth;
        }
        if (resultSize.Height > targetHeight)
        {
            resultSize.Width = Math.round((targetHeight / resultSize.Height) * resultSize.Width);
            resultSize.Height = targetHeight;
        }
        
        return resultSize;
    }
    function resizePopup(_width, _height, _top, _left, callBack)
    {
        popup.stop().animate({
            width: _width,
            height: _height,
            top: _top,
            left: _left
        }, "slow", callBack);
    }
    function startPlay()
    {
        if (imagesCount == 1)
            return;

        isPlaying = true;
        if (currentItemIndex < imagesCount - 1)
        {
            popup.oneTime(options.playDelay, "play", function(){
                yoxviewApi.next();
            });
        }
        else
        {
            if (options.loopPlay)
                popup.oneTime(options.playDelay, "play", function(){
                    yoxviewApi.select(0, null);
                });
            else
                stopPlay();
        }
    }
    function stopPlay()
    {
        popup.stopTime("play");
        isPlaying = false;
    }

    function blink(_element)
    {
        _element.animate({ opacity : 0.8 }, 1000, function()
        {
            $(this).animate({opacity: 0.2}, 1000, blink($(this)));
        });
    }
    
    var newPanel = panel1;
    var oldPanel = panel2;
    
    function getWindowDimensions()
    {
        var widthVal = $(parent.window).width();
        var heightVal = $(parent.window).height();
        var returnValue = {
            height : heightVal,
            width : widthVal,
            usableHeight : heightVal - options.popupMargin * 2,
            usableWidth : widthVal - options.popupMargin * 2
        };
        return returnValue;
    }
    this.resize = function()
    {
        if (isPlaying)
        {
            resumePlay = true;
            stopPlay();
        }

        var windowDimensions = getWindowDimensions();
        var imageMaxSize = newPanel.data("maxSize");

        if (!imageMaxSize || !imageMaxSize)
            return;
            
        var newImageDimensions = fitImageSize(
            imageMaxSize.width,
            imageMaxSize.height,
            windowDimensions.usableWidth,
            windowDimensions.usableHeight);

        newPanel.css({"width" : "100%", "height" : "100%"});
        
        var marginTop = Math.round((windowDimensions.height - newImageDimensions.Height) / 2);
        var marginLeft = Math.round((windowDimensions.width - newImageDimensions.Width) / 2);
        
        isResizing = true;
        if (newPanel.isMedia)
            ctlButtons.animate({top: newImageDimensions.Height / 2 - mediaButtonsSize.height / 2}, "slow");
            
        resizePopup(newImageDimensions.Width,
            newImageDimensions.Height,
            marginTop,
            marginLeft,
            function(){
                var newImageWidth = popup.width();
                var newImageHeight = popup.height();

                newPanel.css({ "width" : newImageWidth + "px", "height" : newImageHeight + "px" });
                isResizing = false;

                if (resumePlay)
                {
                    startPlay();
                    resumePlay = false;
                }
            }
        );
    }

    function setTitleHeight()
    {
        var titleHeight = popupInfoTitle.outerHeight();

        if (titleHeight < popupInfoTitleMinHeight)
            titleHeight = popupInfoTitleMinHeight;
            
        popupInfoBack.animate({height : titleHeight}, "fast");
    }
	function changeMedia(media)
	{
	    var currentImageElement;
	    
        if (panel1.css('z-index') == 1)
        {
            newPanel = panel1;
            currentImageElement = image1;
            oldPanel = panel2;
        }
        else
        {
            newPanel = panel2;
            currentImageElement = image2;
            oldPanel = panel1;
        }

        newPanel.data("maxSize", { width: media.width, height: media.height});           
        var windowDimensions = getWindowDimensions();
            
        var newImageDimensions = fitImageSize(
            media.width,
            media.height,
            windowDimensions.usableWidth,
            windowDimensions.usableHeight);

        popupInfoTitle.html(media.title);
        if (imagesCount > 1)
            countDisplay.html(currentItemIndex + 1 + "/" + imagesCount);
        
        var panelData = newPanel.data("yoxviewPanel");
		if (!media.type || media.type === "image")
		{
			currentImageElement.attr({
				src : media.src,
				title : media.title,
				alt: media.alt
			});
			
			ctlButtons.css({"height": "100%", "width": "50%", "top": "0"});
			if(newPanel.isMedia)
			{
			    panelData.media.remove();
			    panelData.media = undefined;
			    panelData.image.show();
			    newPanel.isMedia = false;
			}
			popupInfo.data("disabled", false);
		}
		else
		{
		    if (!panelData.media)
		    {
		        panelData.media = $("<div>", {
		            className: "yoxview_mediaPanel"
		        });
		        panelData.image.hide();
		        newPanel.append(panelData.media);
		    }
		    else
		        panelData.media.show();
		        
			panelData.media.html(media.html);
			ctlButtons.css({
			    "width": mediaButtonsSize.width,
			    "height": mediaButtonsSize.height,
			    "top": (newImageDimensions.Height / 2) - (mediaButtonsSize.height / 2)
			});
			if (!newPanel.isMedia)
			{
			    panelData.image.hide();
			    newPanel.isMedia = true;
			}
			popupInfo.css("display", "none")
			.data("disabled", true);
		}
        if (firstImage)
            newPanel.animate({
                width: newImageDimensions.Width,
                height: newImageDimensions.Height
            }, "slow");
        else
            newPanel.css({
                "width" : newImageDimensions.Width + "px",
                "height" : newImageDimensions.Height + "px"
            });
            
        var marginTop = Math.round((windowDimensions.height - newImageDimensions.Height) / 2);
        var marginLeft = Math.round((windowDimensions.width - newImageDimensions.Width) / 2);
              
        if (loading)
            hideLoaderIcon();

        isResizing = true;
        resizePopup(newImageDimensions.Width,
            newImageDimensions.Height,
            marginTop,
            marginLeft,
            function()
            {
                if (firstImage)
                {
                    popupBars.css("display", "block");
                    
                    if (options.showButtonsOnOpen)
                        ctlButtons.animate({opacity: 0.5}, 1500).oneTime(1700, function(){
                            if(options.buttonsFadeTime != 0)
                                $(this).animate({opacity : 0}, 1500);
                        });
                    
                    if (options.showBarsOnOpen)
                        popupBars
                        .animate({ opacity: 1}, 1500)
                        .oneTime(1700, function(){
                            $(this).animate({opacity : 0}, 1500);
                        });

                    setTitleHeight();
                    
                    if (options.autoPlay)
                        yoxviewApi.play();

                    if (options.onOpen)
                        options.onOpen();
                        
                    if (onOpenCallback)
                    {
                        onOpenCallback();
                        onOpenCallback = undefined;
                    }
            
                    firstImage = false;
                }
                isResizing = false;
            }
        );

        newPanel.css('z-index', '2');
        oldPanel.css('z-index', '1');
        
        newPanel.fadeIn("slow", function(){
            oldPanel.css('display', 'none');

            if ((!media.type || media.type === "image") && media.title && media.title != "")
            {
                popupInfo.css({
                    "display" : "block"          
                });
                
                setTitleHeight();
                
                if (options.displayImageTitleByDefault)
                {
                    popupInfo.stop().stopTime().animate({ opacity: 1}, 500, function()
                        {
                            $(this).oneTime(options.titleDisplayDuration, function()
                                {
                                    $(this).stop().animate({opacity : 0}, 500);
                                });
                        }
                    );
                }
            }
            else if (popupInfo.css("display") != "none")
            {
                popupInfo.fadeOut(options.buttonsFadeTime);
            }   
            if (imagesCount > 1)
            {
                if (currentItemIndex < imagesCount - 1 && options.cacheImagesInBackground)
                        cacheImages(currentItemIndex + 1);

                if (isPlaying)
                    startPlay();
            }
        });
        
        
	}
    $(tempImg).load(function()
    {
		if (this.width == 0)
		{
		    displayError("Image error");
            return;
        }
        changeMedia($.extend({}, currentImage.media, {
            width: this.width,
            height: this.height
        }));
    })
    .error(function(){
        displayError("Image not found:<br /><span class='errorUrl'>" + this.src + "</span>");
    });
    
    function loadAndDisplayMedia(media)
    {
        if (!media.loaded)
        {
            if (!media.type || media.type === "image")
                tempImg.src = media.src;
            else
                loadMedia(
                    media, 
                    function(loadedMedia){
                        changeMedia(loadedMedia);
                    },
	                function(errorSender)
	                {
	                    displayError("Error getting data from:<br /><span class='errorUrl'>" + errorSender.data.url + "</span>");
	                }
                );
		}
		else
		    changeMedia(currentImage.media);
    }
    function loadMedia(media, onLoad, onError)
    {
        if (!media.type || media.type !== "image")
        {
            if (!mediaLoader)
                mediaLoader = new yoxviewMedia();
            
	        mediaLoader.loadMedia(
	            media.provider,
	            media.url,
	            options.videoSize,
	            function(mediaData){
	                $.extend(media, mediaData, {loaded: true});
	                if (onLoad)
	                    onLoad(media);
	            },
	            onError
            );
        }
    }
    function displayError(errorMsg)
    {
        changeMedia({
            html: "<span class='yoxview_error'>" + errorMsg + "</span>",
            width: 500,
            height: 300,
            type: "error",
            title: ""
        });
    }
    // deep-compare objects:
    function compare(obj1, obj2)
    {
        function size(obj)
        {
            var size = 0;
            for (var keyName in obj)
            {
                if (keyName != null)
                    size++;
            }
            return size;
        }
        
        if (size(obj1) != size(obj2))
            return false;
            
        for(var keyName in obj1)
        {
            var value1 = obj1[keyName];
            var value2 = obj2[keyName];
            
            if (typeof value1 != typeof value2)
                return false;

            if (value1 && value1.length && (value1[0] !== undefined && value1[0].tagName))
            {
                if(!value2 || value2.length != value1.length || !value2[0].tagName || value2[0].tagName != value1[0].tagName)
                    return false;
            }
            else if (typeof value1 == 'function' || typeof value1 == 'object') {
                var equal = compare(value1, value2);
                if (!equal)
                    return equal;
            }
            else if (value1 != value2)
                return false;
        }
        return true;
    }
    this.unload = function(){
        jQuery.each(views, function(i, view){
            $(view).find("a:has(img)").unbind("click.yoxview")
        });
        
        if (popup){
            popup.parent().remove();
            popup = undefined;
        }
    };
}

function getYoxviewPath()
{
    var scripts = document.getElementsByTagName("script");
    var regex = /(.*)jquery.yoxview.*/i;
    for(var i=0; i<scripts.length; i++)
    {
        var currentScriptSrc = scripts[i].src;
        if (currentScriptSrc.match(regex))
            return currentScriptSrc.match(regex)[1];
    }
    
    return null;
}