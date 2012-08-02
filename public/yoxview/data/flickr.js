﻿/*!
 * YoxView Flickr plugin
 * http://yoxigen.com/yoxview/
 *
 * Copyright (c) 2010 Yossi Kolesnicov
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: 19th April, 2010
 * Version : 1.41b
 */ 
function yoxview_flickr(){function s(c,g,d,a){var l=c.data("yoxview").viewIndex,i=[];h.jsonp({url:o,async:false,data:d,dataType:"jsonp",callbackParameter:"jsoncallback",success:function(f){if(f.photosets&&f.photosets.photoset.length!=0){h("<ul>",{className:"yoxview-thumbnails"}).appendTo(c);var j=[];jQuery.each(f.photosets.photoset,function(b,e){if(e.photos!="0"){var k=e.title?e.title._content:"Set";k+=" ("+e.photos+" images)";k={thumbnailSrc:q(e,m[d.thumbnailsMaxSize]),thumbnailDimensions:{width:75, height:75},link:r+"photos/"+(d.user||d.user_id)+"/sets/"+e.id,media:{title:k,alt:e.title||"Set"}};j.push(k)}});c.yoxthumbs({images:j});c.yoxthumbs("thumbnails").yoxview(g,a)}else if(f.photoset&&f.photoset.photo.length!=0&&g.setSinglePhotosetThumbnails){t(f,undefined,i,d.imagesSize,d.thumbnailsMaxSize);c.addClass("yoxview-thumbnails");if(g.setTitle){var n=h("<div>",{className:"yoxview-thumbnails-details"});h.jsonp({url:o,async:false,data:h.extend({},{method:"flickr.photosets.getInfo",photoset_id:g.photoset_id}, u),dataType:"jsonp",callbackParameter:"jsoncallback",success:function(b){b=b.photoset;n.append("<h2>"+b.title._content+"</h2>","By ","<a href='"+r+"photos/"+b.owner+"' title=\"Go to "+(g.user||"the user's")+"'s flickr page\" target='_blank'>"+g.user+"</a>","<div style='clear:both;'></div>").prependTo(c)}})}c.yoxthumbs({images:i,onClick:function(b){yoxviewApi.openGallery(h(b.liveFired).data("yoxview").viewIndex,h(b.currentTarget).data("yoxthumbs").imageIndex);return false}})}a.onLoadComplete&&a.onLoadComplete()}, error:function(f,j){a.onLoadError&&a.onLoadError("Can't load data from flickr.")}});return i}function q(c,g){return"http://farm"+c.farm+".static.flickr.com/"+c.server+"/"+(c.primary||c.id)+"_"+c.secret+g+".jpg"}function t(c,g,d,a,l){jQuery.each(c.photoset.photo,function(i,f){var j={thumbnailSrc:q(f,l?m[l]:m.smallSquare),link:"#",thumbnailImg:g?g.children("img:first"):null,media:{src:q(f,a?m[a]:m.medium),title:f.title,alt:f.title}};d.push(j)})}var h=jQuery,r="http://www.flickr.com/",o="http://api.flickr.com/services/rest/", w=/\d+@N\d+/,u={api_key:"cd6c91f9721f34ead20e6ebe03dd5871",format:"json"};this.getImagesData=function(c,g,d){var a=jQuery.extend({},{imagesSize:"medium",thumbnailsMaxSize:"smallSquare",setThumbnail:true,setSinglePhotosetThumbnails:true,setTitle:true,method:"flickr.photosets.getList"},d.dataSourceOptions,u);a.media="photos";if(a.user&&a.photoset_id)a.method="flickr.photosets.getPhotos";var l=screen.width>screen.height?screen.width:screen.height;if(!a.imagesSize||l.width<=800&&a.imagesSize!="medium")a.imagesSize= "medium";var i=[],f=0,j=/http:\/\/(www.)?flickr.com\/photos\/([^\/]+)\/sets\/([^\?]+).*/,n=c[0].tagName=="A";(n?c:c.find("a:has(img)")).each(function(){var b=h(this),e=this.href.match(j);if(e){e={user:e[2],photoset_id:e[3]};var k=b.data("yoxview");k?jQuery.extend(k,e):b.data("yoxview",e);var p=n?b.data("yoxview"):b.parent().data("yoxview");b.bind("click.yoxview",function(){var x=h(this).data("yoxview");if(p.imagesAreSet)yoxviewApi.openGallery(n?b.data("yoxview").viewIndex:b.parent().data("yoxview").viewIndex); else{b.css("cursor","wait");h.jsonp({url:o,data:jQuery.extend({},a,x,{method:"flickr.photosets.getPhotos",api_key:"cd6c91f9721f34ead20e6ebe03dd5871",format:"json",media:"photos"}),dataType:"jsonp",callbackParameter:"jsoncallback",success:function(y){var v=[];t(y,b,v,a.imagesSize,a.thumbnailsMaxSize);p.images=v;p.imagesAreSet=true;b.css("cursor","");yoxviewApi.openGallery(p.viewIndex)}})}return false});f++}});if(f==0){d.onLoadBegin&&d.onLoadBegin();if(a.user&&a.user.match(w))a.user_id=a.user;if(!a.user_id&& a.user&&!a.photoset_id)h.jsonp({url:o,data:h.extend({},a,{username:a.user,method:"flickr.people.findByUsername"}),dataType:"jsonp",callbackParameter:"jsoncallback",success:function(b){if(!b.user&&d.onLoadError){d.onLoadError("User not found.");return false}a.user_id=b.user.nsid;if(a.setTitle){var e=h("<div>",{className:"yoxview-thumbnails-details"});b=b.user.username._content;e.append("<h2><a href='"+r+"photos/"+a.user_id+"' target='_blank' title=\"Go to "+b+"'s gallery in flickr\">"+b+"</a>'s sets:</h2>", "<div style='clear:both;'></div>").prependTo(c)}i=s(c,g,a,d)},error:function(b,e){d.onLoadError&&d.onLoadError("User not found. Have you tried using the NSID?")}});else i=s(c,a,a,d)}return i};var m={smallSquare:"_s",thumbnail:"_t",small:"_m",medium:"",large:"_b",original:"_o"}};