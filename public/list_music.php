<?php

/**** *******
	List Reddit Music
	author: Ryan Guthrie (ryanguthrie.com)
	description: Access memcache to get parsed reddit music links
	output as json for easy ajaxing
**** ***** */

header('Content-type: application/json');
$playlist = "recommends";

$playlists = array(
	"chill",
	"mashups","mixes","classical","electronic",
	"wearethemusic","music","recommends","listentothis",
	"funny","videos","pics","bigpicture","video",
	"itap","windowshots","wallpaper","gonewild"
	);

if($_GET['pl'] && in_array($_GET['pl'],$playlists) ){ $playlist = $_GET['pl']; }

$keylist = getSongs($playlist);
$keyblah = array( "Songs"=>$keylist );
print json_encode($keyblah);
exit;


function getSongs($pl)
{
$mc = new Memcache;
$mc->connect('localhost',11211) or die("Could not connect to memcache\n");
$keylist = $mc->get($pl);
//print_r($keylist);

$i = 0;
$x = 0;
while($i < count($keylist) )
{		
	$key = $keylist[$i];
	if($key){
	//if($pl == "recommends"){
	$song = $mc->get($key); 
	//else { $song = $key; }
	$keylist[$x] = $song;
	$x++;
	}
	$i++;
}
if($keylist && count($keylist) > 0 ){ $keylist = array_reverse($keylist); }
return $keylist;

}





?>
