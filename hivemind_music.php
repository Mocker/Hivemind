<?php

/**** Reddit Music Parser **
 author: Ryan Guthrie  (ryanguthrie.com)
 description: Parse the reddit music thread for youtube links. Add link and comment data to memcache

 TODO: refactor to parse several locations. store several playlists with each parsed music	
Sources: Reddit Comments, Subreddit, Boston.com Big Picture
 
**** ****** */

$debug = 1;

$mc = new Memcache;
$mc->connect('localhost',11211) or die("Could not connect to memcache\n");
$keylist = array();

$url = 'http://www.reddit.com/r/AskReddit/comments/b9ud4/submit_one_song_that_you_think_everyone_should/.json?sort=new&all=true';
$browser_id = 'Hivemind/1.0 sokercap@gmail.com';

//What sources to parse - pl name,url, type, media
$sources = array
(
	array('recommends','http://www.reddit.com/r/AskReddit/comments/b9ud4/submit_one_song_that_you_think_everyone_should/.json?sort=new&all=true','comments',array('music'=>1) ),
	array('listentothis','http://www.reddit.com/r/listentothis/.json?sort=new&all=true','subreddit',array('music'=>1,'video'=>1)),
	array('funny','http://www.reddit.com/r/funny/.json?sort=new&all=true','subreddit',array('music'=>1,'video'=>1,'pics'=>1)),
	array('videos','http://www.reddit.com/r/videos/.json?sort=new&all=true','subreddit',array('video'=>1)),
	array('pics','http://www.reddit.com/r/pics/.json?sort=new&all=true','subreddit',array('pics'=>1)),
	array('electronic','http://www.reddit.com/r/electronicmusic/.json?sort=new&all=true','subreddit',array('music'=>1,'video'=>1)),
	array('bigpicture','http://www.boston.com/bigpicture/.json?sort=new&all=true','bigpicture',array('pics'=>1)),
	array("itap","http://www.reddit.com/r/itookapicture/new/.json?sort=new&all=true","subreddit",array("pics"=>1)),
	array("windowshots","http://www.reddit.com/r/windowshots/new/.json?sort=new&all=true","subreddit",array("pics"=>1)),
	array("wallpaper","http://www.reddit.com/r/wallpaper/new/.json?sort=new&all=true","subreddit",array("pics"=>1)),
	array("gonewild","http://www.reddit.com/r/gonewild/new/.json?sort=new&all=true","subreddit",array("pics"=>1,"video"=>1)),
	array('video','http://www.reddit.com/r/video/.json?sort=new&all=true','subreddit',array("video"=>1)),
	array('music','http://www.reddit.com/r/music/.json?sort=new&all=true','subreddit',array("music"=>1,"video"=>1)),
	array('wearethemusic','http://www.reddit.com/r/WeAreTheMusicMakers/.json?sort=true&all=true','subreddit',array('music'=>1,'video'=>1,'pics'=>1)),
	array('classical','http://www.reddit.com/r/classicalmusic/.json?sort=true&all=true','subreddit',array('music'=>1,'video'=>1)),
	array('mixes','http://www.reddit.com/r/mixes/.json?sort=true&all=true','subreddit',array('music'=>1,'video'=>1)),
	array('mashups','http://www.reddit.com/r/mashups/.json?sort=true&all=true','subreddit',array('music'=>1,'video'=>1)),
	array('chill','http://www.reddit.com/r/chillmusic/.json?sort=true&all=true','subreddit',array('music'=>1,'video'=>1)),
);

foreach( $sources as $src){
	beginParse($src);
	sleep(1);
}


/**************** end global code ***********/


//Begin parsing an individual source based on source type
function beginParse($source){
	global $keylist, $mc, $debug, $browser_id;
	$ch = curl_init();
	$cOptions = array
	(
		CURLOPT_URL=>$source[1],
		CURLOPT_HEADER=>false,
		CURLOPT_RETURNTRANSFER=>true,
		CURLOPT_FOLLOWLOCATION=>true,
		CURLOPT_USERAGENT=>$browser_id
	);
	curl_setopt_array($ch,$cOptions);
	$rawURL = curl_exec($ch);
	//curl_close($ch);

	if($debug){ print "Fetched json with size ".strlen($rawURL)."\n"; 
		print substr($rawURL,0,200)."\n";
		if(strlen($rawURL)< 100){
			print "EMPTY RESULTS: url- ".$source[1]." -ERROR: ".curl_error($ch)."\n";
		}
		print "\n\n";
	}
	curl_close($ch);

	$keylist = array();
	
	$parsed = 0;
	if($source[2] == 'subreddit'){
		$parsed = parseSubreddit($source,$rawURL);
	}
	elseif($source[2] == 'comments'){
		$parsed = parseComments($source,$rawURL);
	}
	elseif($source[2] == 'bigpicture'){
		$parsed = parseBigPicture($source,$rawURL);
	}
	else {
		//fail - no matching source type
		if($debug){ print "Source (".$source[0].") has no matching parse type - ".$source[2]." - skipping.. \n\n"; }
		return;
	}
	if(!$parsed){
		if($debug){ print "Source (".$source[0].") failed to parse - skipping.. \n\n"; }
		return;
	}
	
	/*
	$rawJSON = json_decode($rawURL,false);
	$jsonERR = json_last_error();
	if($jsonERR != JSON_ERROR_NONE){ die("Error parsing reddit json - ".$jsonERR."\n"); }

	if($debug){ print "JSON parsed!\n"; }
	//print $rawJSON[0]->children[0]->{'title'}."\n";
	//print_r($rawJSON[0]->data->children[0]->data);

	$threadData = $rawJSON[0]->data->children[0]->data;
	if($debug) { print $threadData->title . "\n".$threadData->selftext."\n*********************\n\n"; }

	//print_r($rawJSON[1]->data->children[1]->data->replies->data->children[0]->data);
	parseChildren($rawJSON[1]->data->children);
	*/
	print "PLAYLIST: ".$source[0]." - ".count($keylist)." ITEMS \n";
	if(count($keylist) > 0 && $source[0]){
		$oldlist = $mc->get($source[0]);
		print "OLD PLAYLIST: ".$source[0]." - ".count($oldlist)." ITEMS \n";
		//determine which of the pulled items do not already exist in the playlist
		/*$offset = 0;
		while( $offset < count($keylist) && in_array($keylist[$offset],$oldlist) ){
			$offset++;
		}
		if($oldlist && count($oldlist) > 0 && $offset < count($keylist)){
			$keylist = array_merge($oldlist, array_slice($keylist, $offset) );
		}*/
		if(!$oldlist || count($oldlist) < 1){
			print "REPLACING OLDLIST\n";
			$oldlist = $keylist ;
		} else {
			foreach($keylist as $key){
				//print "CHECKING FOR EXISTENCE OF ".$key." ... ";
				if(! in_array($key, $oldlist )){
					array_push($oldlist, $key); 
					//print "Does Not Exist!\n";
					}
				//else { print "Already exists!\n"; }
			}
		}
		
		print "NEW PLAYLIST: ".$source[0]." - ".count($oldlist)." ITEMS \n".print_r($oldlist,1)."\n\n";
		$mc->set($source[0],$oldlist);
	}
}

//start parsing a subreddit
function parseSubreddit($source,$raw){
	global $debug, $keylist, $mc;
	$rawJSON = json_decode($raw,false);
	$jsonERR = json_last_error();
	if($jsonERR != JSON_ERROR_NONE){ 
		if($debug){ print "Error parsing reddit json - ".$jsonERR."\n"; } 
		return 0;
		}

	if($debug){ print "JSON parsed!\n"; }
	
	//each submission stored as an entry in the main data array
	foreach($rawJSON->data->children as $li)
	{
		$entry = $li->data;
		
		//restrict parsing to media type
		$ismedia = 0;
		$oembed = 0; //flag if there is compatible embedding code
		$rembed = 0; //flag for embed html junk
		$media = 'none';
		if($source[2]['video'] ){
			if( $entry->domain == 'youtube.com'  ){
				$ismedia = 1; }
			if($entry->media && $entry->media->oembed && $entry->media->oembed->type == "rich"){ $ismedia = 1; $oembed = 1; }
			if(!$oembed && isset($entry) && $entry->media_embed && isset($entry->media_embed->content) ){ $ismedia = 1; $rembed = 1; }
		}
		if($source[2]['music'] ){
			if( $entry->domain == 'youtube.com' || $entry->domain == 'soundcloud.com' ){
				$ismedia = 1; }
			if($entry->media && $entry->media->oembed && ( $entry->media->oembed->type == "rich" || $entry->media->oembed->type == "video" ) ){
				$ismedia = 1;  $oembed = 1;}
			if(!$oembed && $entry->media_embed && isset($entry->media_embed->content) ){ $ismedia = 1; $rembed = 1; }
		}
		if($ismedia == 0 && $source[2]['pics'] ){
			$ext = substr($entry->url, strrpos($entry->url, '.') + 1);
			if($ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'gif' ){
				$ismedia = 1; $media = 'pic';  }
		}
		
		if($ismedia == 0){ continue; } //invalid media type, skip to next entry
	
	$info = 0;
	if($oembed){ 
		$info = parseSubEmbed($entry); }
	elseif($rembed){
		if($debug){ print $entry->subreddit ." - ".$entry->title." : REMBED OK\n"; }
		$info = parseSubREmbed($entry); }
	elseif($ismedia && $media != 'pic' && ($source[2]['music'] || $source[2]['video'] ) ){
		$info = parseSubTube($entry); }
	elseif( $ismedia && $source[2]['pics'] ){
		//parse picture info
		$info = array (
				"id"=> ($entry->subreddit."_".$entry->id),
				"title_r"=>$entry->title,
				"body"=>$entry->selftext,
				"body_h"=>$entry->selftext,
				"thumbnail"=>$entry->thumbnail,
				"author"=>$entry->author,
				"ups"=>$entry->ups,
				"source"=>$entry->domain,
				"media"=>"pic",
				"downs"=>$entry->downs,
				"link"=> $entry->url,
				"score"=> ($entry->ups - $entry->downs)
				);
	}
	
	if(!$info){ continue; } //didn't receive valid song infos
	if(!$info['id']){
		if($debug){ print "NO ID FOR ITEM:\n".print_r($info,1)."\n\n"; }
		continue;
	}		
	
		array_push($keylist,$info['id']);
        $mc->set($info['id'],$info,0,259200); 
		//print "LOADED MEDIA: \n".print_r($info,1)."\n\n";
	
	}
	
	if($debug) { print "DONE LOADING PLAYLIST ".$source[0]." - ".count($keylist)." ITEMS\n\n"; }
	
	return 1;
}

//parse embedded media
function parseSubEmbed($entry){
	$thumburl = isset($entry->media->oembed->thumbnail) ? $entry->media->oembed->thumbnail : 'http://i.imgur.com/Iu8Sljx.png';
	$info = array (
				"id"=> ($entry->subreddit."_".$entry->id),
				"title_r"=>$entry->title,
				"body"=>$entry->selftext,
				"body_h"=>$entry->selftext,
				"author"=>$entry->author,
				"ups"=>$entry->ups,
				"source"=>$entry->domain,
				"media"=>$entry->media->oembed->type,
				"embed_html"=>$entry->media->oembed->html,
				"embed" => 1,
				"embed_provider"=>$entry->media->oembed->provider_name,
				"embed_thumb"=> $thumburl,
				"downs"=>$entry->downs,
				"link"=> $entry->url,
				"score"=> ($entry->ups - $entry->downs)
				);
	return $info;
}
function parseSubREmbed($entry){
	 $info = array (
                                "id"=> ($entry->subreddit."_".$entry->id),
                                "title_r"=>$entry->title,
                                "body"=>$entry->selftext,
                                "body_h"=>$entry->selftext,
                                "author"=>$entry->author,
                                "ups"=>$entry->ups,
                                "source"=>$entry->domain,
                                "media"=>'video',
                                "embed_html"=>$entry->media_embed->content,
                                "embed" => 1,
                                "embed_provider"=>$entry->domain,
                                "embed_thumb"=> $entry->thumbnail,
                                "downs"=>$entry->downs,
                                "link"=> $entry->url,
                                "score"=> ($entry->ups - $entry->downs)                                );
        return $info;
}

//no embed, parse supported tube site for media link - right now youtube and soundcloud i think
function parseSubTube($entry){
 return 0;
}

//start parsing a reddit comment thread
function parseComments($source,$raw){
	global $debug;
	$rawJSON = json_decode($raw,false);
	$jsonERR = json_last_error();
	if($jsonERR != JSON_ERROR_NONE){ 
		if($debug){ print "Error parsing reddit json - ".$jsonERR."\n"; } 
		return 0;
		}

	if($debug){ print "JSON parsed!\n"; }
	//print $rawJSON[0]->children[0]->{'title'}."\n";
	//print_r($rawJSON[0]->data->children[0]->data);

	$threadData = $rawJSON[0]->data->children[0]->data;
	if($debug) { print $threadData->title . "\n".$threadData->selftext."\n*********************\n\n"; }
	
	//print_r($rawJSON[1]->data->children[1]->data->replies->data->children[0]->data);
	
	//start parsing each level of comments
	parseChildren_Comments($source[2],$rawJSON[1]->data->children);
	return 1;
}

//start parsing Boston Big Picture
function parseBigPicture($source,$raw){
	return 0;
}

//Main recursive parser for Reddit Comments. Feed it the types to look for and children array and it parses for links and feeds itself any replies
function parseChildren_Comments($types,$list)
{
	global $mc, $debug, $keylist;
	$limit = 50;
	$i = 0;
	foreach($list as $li)
	{
		//if($i > $limit) { exit; }
		
		if($types['video'] || $types['music'] ) {
		if($li->data && $li->data->body &&  preg_match('/\[(.+?)\]\(http:\/\/www\.youtube\.com\/watch(?:\?|(?:\#\!))v=([\w\-]+)/S',$li->data->body,$matches) )
		{
			//if($debug) { print $matches[0]."\n".$matches[1]." - ".$matches[2]."\n\n"; }
			$song_info = array (
				"id"=>$matches[2],
				"title_r"=>$matches[1],
				"body"=>$li->data->body,
				"body_h"=>$li->data->body_html,
				"author"=>$li->data->author,
				"ups"=>$li->data->ups,
				"source"=>"youtube",
				"media"=>"video",
				"downs"=>$li->data->downs,
				"link"=> ('http://www.youtube.com/watch?v='.$matches[2]),
				"score"=> ($li->data->ups - $li->data->downs)
				);
			array_push($keylist,'youtube_'.$matches[2]);
			$mc->set('youtube_'.$matches[2],$song_info,0,259200);
			
		} 
		else {
			if($li->data && $li->data->body_html && preg_match('/http:\/\/www\.youtube\.com\/watch\?v=([\w\-\_]+)/S',$li->data->body_html,$matches) )
			{
			 if($debug) { print $matches[0]."\n".$li->data->body."\n\n"; }
                        $song_info = array (
                                "id"=>$matches[1],
                                "title_r"=>$li->data->body,
                                "body"=>$li->data->body,
                                "body_h"=>$li->data->body_html,
                                "author"=>$li->data->author,
                                "ups"=>$li->data->ups,
								"source"=>"youtube",
								"media"=>"video",
				"link"=>$matches[0],
                                "downs"=>$li->data->downs,
                                "score"=> ($li->data->ups - $li->data->downs)
                                );
				array_push($keylist,'youtube_'.$matches[1]);
				//print "SAVING SONG ".$song_info->title_r." to MC\n";
                $mc->set('youtube_'.$matches[1],$song_info,0,259200); 
			}	
			else { //print "NOO : "; print_r($li->data->body); print "\n";
			}
		}
		}
		
		
		if($li->replies && $li->replies->kind && $li->replies->kind == "Listing"){ parseChildren_Comments($types, $li->replies->data->children); }

		$i++;
	} //end loop
}

