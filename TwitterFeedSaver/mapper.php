<?php
/*
	 *	Twitter Mapper 
	 * 
	 *  Mapps the information from the stream to the database
	 *  Some bits are messy.. but it works :P 
	 * 
	 *  James Rundquist - james.k.rundquist@gmail.com
	 */



define('DB_HOST','localhost');
define('DB_NAME','infoViz');
define('DB_USER','info');
define('DB_PASS','viz');

class Database 
{ 
    // Store the single instance of the PDO connection 
    private static $m_pInstance; 

    private static function new_connection() {
		try {
			$db = new PDO('mysql:dbname='.DB_NAME.';host='.DB_HOST, DB_USER, DB_PASS);
		}
		catch(PDOException $e){
			error_log("Database Fail: ".$e);
			die("Database failed");
		}
		return $db;
	} 

    public static function getInstance() 
	{ 
		if (!self::$m_pInstance){ 
			self::$m_pInstance = self::new_connection();
		}
 		return self::$m_pInstance; 
	} 
}



class Mapper{
	
	const DB_INSERT_USER 	= "INSERT INTO `users` 	(url, is_translator, default_profile_image, default_profile, description, followers_count, time_zone, location, notifications, friends_count, profile_sidebar_border_color, profile_image_url, statuses_count, profile_link_color, profile_background_color, lang, profile_use_background_image, profile_background_image_url, favourites_count, profile_text_color, show_all_inline_media, screen_name, contributors_enabled, geo_enabled, profile_background_tile, protected, following, created_at, profile_sidebar_fill_color, name, verified, id, utc_offset)
															VALUES 
															(:url, :is_translator, :default_profile_image, :default_profile, :description, :followers_count, :time_zone, :location, :notifications, :friends_count, :profile_sidebar_border_color, :profile_image_url, :statuses_count, :profile_link_color, :profile_background_color, :lang, :profile_use_background_image, :profile_background_image_url, :favourites_count, :profile_text_color, :show_all_inline_media, :screen_name, :contributors_enabled, :geo_enabled, :profile_background_tile, :protected, :following, :created_at, :profile_sidebar_fill_color, :name, :verified, :id, :utc_offset)";
	
	const DB_INSERT_URL 	= "INSERT INTO `urls` 		(`url`, `start_index`, `end_index`) VALUES (:url, :start, :end);";
	const DB_LINK_URL		= "INSERT INTO `tweet_urls` (`tweet_id`, `url_id`) VALUES (:tweet, :url);";	
	
	const DB_INSERT_HASHTAG	= "INSERT INTO `hashtags` (`text`, `start_index`, `end_index`) VALUES (:tag, :start, :end);";	
	const DB_LINK_HASHTAG	= "INSERT INTO `tweet_hashtags` (`tweet_id`, `hashtag_id`) VALUES (:tweet, :hashtag);";	
	
	const DB_INSERT_MENTIONS	= "INSERT INTO `user_mentions` (`user_id`, `screen_name`, `name`, `start_index`, `end_index`) VALUES (:user_id, :screen_name, :name , :start, :end);";	
	const DB_LINK_MENTIONS		= "INSERT INTO `tweet_user_mentions` (`tweet_id`, `user_mention_id`) VALUES (:tweet, :mention);";
	
	const DB_INSERT_PLACE		= "INSERT INTO  `places`   (`id` ,`url` ,`name` ,`full_name` ,`place_type` ,`country_code` ,`country` , `bb_x1` ,`bb_y1` ,`bb_x2` ,`bb_y2` ,`bb_x3`, `bb_y3`,`bb_x4` ,`bb_y4` ,`bb_type`)
													VALUES (:id ,:url ,:name ,:full_name ,:place_type ,:country_code ,:country , :bb_x1 ,:bb_y1 ,:bb_x2 ,:bb_y2 ,:bb_x3 ,:bb_y3 ,:bb_x4 ,:bb_y4 ,:bb_type);";
	const DB_INSERT_COORDINATES = "INSERT INTO `coordinates` ( `type`, `x`, `y` ) VALUES (:type, :x, :y);";
	
	const DB_INSERT_TWEET 		= "INSERT INTO `tweets` (`id`, `user_id`, `text`, `source`, `contributors`, `coordinates_id`, `geo_id`, `place_id`, `in_reply_to_user_id`, `in_reply_to_screen_name`, `in_reply_to_status_id`, `retweeted`, `retweet_count`, `truncated`, `favorited`, `created_at`, `collected_on`) VALUES
														(:id,  :user_id , :tweet, :source,  :contributors,  :coordinates, 	  :geo,     :place 	  , :in_reply_to_user_id , :in_reply_to_screen_name , :in_reply_to_status_id , :retweeted , :retweet_count , :truncated , :favorited , :created_at, NOW() )
												ON DUPLICATE KEY UPDATE `retweeted` = :retweeted, `retweet_count` = :retweet_count, `favorited` = :favorited";
	
	public static function save(stdClass $j){
		
		if ( isset($j->retweeted_status) && is_object($j->retweeted_status) ){
			$j->retweeted_status->retweet_count++;
			$j->retweeted_status->retweeted = true;
			self::save($j->retweeted_status);
		}
		
		$coordinates 	= self::save_coordinates($j->{'coordinates'});
		$place			= self::save_place($j->{'place'});
		
		if ( is_object($j->geo) && is_object($j->coordinates) && $j->geo->coordinates[0] != $j->coordinates->coordinates[1] && $j->geo->coordinates[1] != $j->coordinates->coordinates[0] )
			$geo 			= self::save_coordinates($j->{'geo'});
		else
			$geo = $coordinates;
		
		self::save_user($j->{'user'});
		self::save_entities($j->{'entities'}, $j->{"id"});
		self::save_tweet($j, $coordinates, $geo, $place);
	}
	
	
	
	
	private static function save_coordinates($c){
		if ( $c == NULL || !is_object($c) ){
			return NULL;
		}
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_COORDINATES);
		
		$insert_query->execute(array("type"=>$c->{'type'}, "x"=>$c->{'coordinates'}[0], "y"=>$c->{'coordinates'}[1]));
		if($insert_query->errorCode() != "00000")
			return NULL;
		return $db->lastInsertId();
	}
	
	
	
	
	private static function save_entities(stdClass $e, $id){
		self::save_urls($e->{'urls'}, $id);
		self::save_hashtags($e->{'hashtags'}, $id);
		self::save_user_mentions($e->{'user_mentions'}, $id);
	}
	
	
	
	
	
	
	private static function save_urls($u, $id){
		$urls = (array)$u;
		
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_URL);
		$link_query	  = $db->prepare(self::DB_LINK_URL);
		
		foreach($urls as $url){
			$insert_query->execute(array("url"=>$url->{'url'}, "start"=> $url->indices[0], "end"=> $url->indices[1]));
			if($insert_query->errorCode() != "00000")
				continue;
			$url_id = $db->lastInsertId();
			$link_query->execute(array("tweet"=>$id, "url"=>$url_id));
		}
		return array();
	}
	
	
	
	
	
	
	
	
	private static function save_hashtags($t, $id){
		$tags = (array)$t;
		
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_HASHTAG);
		$link_query	  = $db->prepare(self::DB_LINK_HASHTAG);
		
		foreach($tags as $tag){
			$insert_query->execute(array("tag"=>$tag->{'text'}, "start"=> $tag->indices[0], "end"=> $tag->indices[1]));
			if($insert_query->errorCode() != "00000"){
				echo "Error\tSaving hashtag";
				continue;
			}
			$tag_id = $db->lastInsertId();
			$link_query->execute(array("tweet"=>$id, "hashtag"=>$tag_id));
			if($link_query->errorCode() != "00000"){
				echo "Error\tLinking hashtag to tweet";
				print_r($link_query->errorInfo());
			}
			
		}
		return array();
	}
	
	
	
	
	private static function save_user_mentions($m, $id){
		$mentions = (array)$m;
		
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_MENTIONS);
		$link_query	  = $db->prepare(self::DB_LINK_MENTIONS);
		
		foreach($mentions as $mention){
			$insert_query->execute(array("user_id"=>$mention->{'id'}, "name"=>$mention->{'name'}, "screen_name"=>$mention->{'screen_name'}, "start"=> $mention->indices[0], "end"=> $mention->indices[1]));
			if($insert_query->errorCode() != "00000"){
			//	print_r($insert_query->errorInfo());
			}
			$mention_id = $db->lastInsertId();
			$link_query->execute(array("tweet"=>$id, "mention"=>$mention_id));
			
			if($link_query->errorCode() != "00000"){
			//	print_r($link_query->errorInfo());
			}
		}
		return array();
	}
	
	
	
	
	
	
	
	private static function save_user($u){
		$db = Database::getInstance();
		$prepared_query = $db->prepare(self::DB_INSERT_USER);
		$user_array = (array)$u;
		
		// Messy... very messy... should fix 
		$a = array(	"url"=>null, "default_profile_image"=>null, "is_translator"=>null, "default_profile"=>null, 
					"description"=>null, "followers_count"=>null, "time_zone"=>null, "location"=>null, 
					"notifications"=>null, "friends_count"=>null, "profile_sidebar_border_color"=>null, "profile_image_url"=>null, 
					"statuses_count"=>null, "profile_link_color"=>null, "profile_background_color"=>null, 
					"lang"=>null, "profile_use_background_image"=>null, "profile_background_image_url"=>null, 
					"favourites_count"=>null, "profile_text_color"=>null, "show_all_inline_media"=>null, 
					"screen_name"=>null, "contributors_enabled"=>null, "geo_enabled"=>null, 
					"profile_background_tile"=>null, "protected"=>null, "following"=>null, 
					"created_at"=>null, "profile_sidebar_fill_color"=>null, "name"=>null, 
					"verified"=>null, "id"=>null, "utc_offset"=>null);
					
		$add_info = array_diff(array_keys($user_array), array_keys($a));
		
		
		$user_array = array_merge($a, $user_array);
		
		
		foreach($add_info as $key){
			unset($user_array[$key]);
		}
		
		$user_array['created_at'] = date('Y-m-d H:i:s', strtotime($user_array['created_at']));

		try{
			$prepared_query->execute($user_array);
		}catch(Exception $e){
			print_r($e);
			print_r($u);
		}
		if($prepared_query->errorCode() != "00000"){
			//print_r($prepared_query->errorInfo());
		}
	}	
	
	
	
	
	
	
	public static function save_place($p){
		if ( $p == NULL || !is_object($p)){
			return NULL;
		}
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_PLACE);
		$bind = array(	
						'id' 			=> 	$p->id,
						'url'			=>	$p->url,
						'name'			=>	$p->name,
						'full_name'		=>	$p->full_name,
						'place_type'	=>	$p->place_type,
						'country_code'	=>	$p->country_code,
						'country'		=> 	$p->country,
						'bb_x1'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][0][0]:0),
						'bb_y1'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][0][1]:0),
						'bb_x2'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][1][0]:0),
						'bb_y2'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][1][1]:0),
						'bb_x3'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][2][0]:0),
						'bb_y3'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][2][1]:0),
						'bb_x4'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][3][0]:0),
						'bb_y4'			=>	(is_object($p->bounding_box)&&is_object($p->bounding_box->coordinates)?$p->bounding_box->coordinates[0][3][1]:0),
						'bb_type'		=> 	(is_object($p->bounding_box)?$p->bounding_box->type:'')
					);
		$insert_query->execute($bind);
		if($insert_query->errorCode() != "00000")
			return NULL;
		return $p->id;		
		
	}
	
	
	
	
	
	public static function save_tweet($j, $coord, $geo, $place){
		$db = Database::getInstance();
		$insert_query = $db->prepare(self::DB_INSERT_TWEET);
		
		preg_match('%>([^<]+?)<%', $j->source, $matches);
		$source = (count($matches) == 2)?$matches[1]:$j->source;
		
		$bind = array(
						'id'						=>	$j->id,
						'user_id'					=>	$j->user->id,
						'tweet'						=>	$j->text,
						'source'					=>	$source,
						'contributors'				=>	$j->contributors,
						'coordinates'				=>	$coord,
						'geo'						=>	$geo,
						'place'						=>	$place,
						'in_reply_to_user_id'		=>	$j->in_reply_to_user_id,
						'in_reply_to_screen_name'	=>	$j->in_reply_to_screen_name,
						'in_reply_to_status_id'		=>	$j->in_reply_to_status_id,
						'retweeted'					=>	$j->retweeted,
						'retweet_count'				=>	$j->retweet_count,
						'truncated'					=> 	$j->truncated,
						'favorited'					=>	$j->favorited,
						'created_at'				=>	date('Y-m-d H:i:s', strtotime($j->created_at))
						);
						
		$insert_query->execute($bind);
		if($insert_query->errorCode() != "00000"){
			print_r($insert_query->errorInfo());
		}
	}
	
}