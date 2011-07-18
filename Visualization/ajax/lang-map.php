<?php

	class Data{
		public $data;
		public $name;
		public function __construct($name='Nameless', $data=array()){
			$this->name		= $name;
			$this->data 	= $data;
		}
	}

	$colors = array('#4695f1',	// blue
					'#644775',	// purple
					'#f14995',	// red
					'#e2d701',	// yellow
					'#75512d',	// brown
					'#ce0c7e');	// pink
	
	
	$passed = filter_input_array(INPUT_GET);

	$l = explode('&', $passed['lang']);
	$i = 0;
	$langs = array();
	foreach($l as $a) {
	    $b = split('=', $a);
	    $langs[] = '"'.$b[0].'"';
	    $i++;
	}
	
	$param['langs'] = implode(',',$langs);
	
	$query_lang = "SELECT u.lang as lang, u.screen_name as name, t.*, c.x as lat, c.y as lng
					FROM `tweets` as t
						INNER JOIN `users` as u ON u.id = t.user_id
						INNER JOIN `coordinates` as c ON c.id = t.coordinates_id
					WHERE 

					t.coordinates_id IS NOT NULL
					
					AND
					
					lang IN(".$param['langs'].")
					
					AND
					(
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) >= ((:hourRangeStart*100)+:minuteRangeStart)
						AND 
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) <= ((:hourRangeEnd*100)+:minuteRangeEnd)
					)
					
					ORDER by t.`created_at` ASC;
					";
	// Query if the time span is split 
	$query_lang_s = "SELECT u.lang as lang, u.screen_name as name, t.*, c.x as lat, c.y as lng
					FROM `tweets` as t
						INNER JOIN `users` as u ON u.id = t.user_id
						INNER JOIN `coordinates` as c ON c.id = t.coordinates_id
					WHERE 

					t.coordinates_id IS NOT NULL

					AND
					
					lang IN(".$param['langs'].")
					
					AND 
					
					(
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) >= ((:hourRangeStart*100)+:minuteRangeStart)
						OR 
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) <= ((:hourRangeEnd*100)+:minuteRangeEnd)
					)

					ORDER by t.`created_at` ASC;
					";

		
	$db = new PDO('mysql:host=localhost;dbname=infoViz', 'info', 'viz');
	$stmt = $db->prepare($query_lang);				
	

	
	$param = array();
	
	
	$param['hourRangeStart'] 	= isset($passed['hs'])?$passed['hs']:0;
	$param['minuteRangeStart'] 	= isset($passed['ms'])?$passed['ms']:0;
	$param['hourRangeEnd'] 		= isset($passed['he'])?$passed['he']:24;
	$param['minuteRangeEnd'] 	= isset($passed['me'])?$passed['me']:60;
	
	// Adjust from EST timezone ( the timezone the tweets were recored from ) to GMT ( for standard time )
	if ( $param['hourRangeEnd'] != 24 && $param['hourRangeStart'] != 0 ){	
		$param['hourRangeStart'] = (24+$param['hourRangeStart']-5)%24;
		$param['hourRangeEnd'] = (24+$param['hourRangeEnd']-5)%24;
	}
	
	if ( $param['hourRangeEnd'] == $param['hourRangeStart'] && $param['minuteRangeStart'] == $param['minuteRangeEnd'] ){
		$param['hourRangeStart'] = 24;
		$param['hourRangeEnd'] = 0;
		$param['minuteRangeStart'] = 0;
		$param['minuteRangeEnd'] = 0;
	}
	
	if ( $param['hourRangeEnd'] < $param['hourRangeStart'] ){
		$stmt = $db->prepare($query_lang_s);				
		
	}
	
	
	$stmt->execute($param);

	$res = $stmt->fetchAll();

	
	if ( !$res ){
		echo json_encode(array());
		die();
	}
	
	
	$dataList = array();
	
	foreach($res as $r){
		$dataList[] = new Data($r['name'], array('tweet'=>$r));
	}

	echo json_encode($dataList);
	die();

?>