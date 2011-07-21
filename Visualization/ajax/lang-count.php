<?php

	class Data{
		public $data;
		public $name;
		public function __construct($name='Nameless', $data=array()){
			$this->name		= $name;
			$this->data 	= $data;
		}
	}
	
	
	$query_lang = "SELECT u.lang as name, count(t.id) as size
					FROM `tweets` as t
						INNER JOIN `users` as u ON u.id = t.user_id

					WHERE 

					(
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) >= ((:hourRangeStart*100)+:minuteRangeStart)
						AND 
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) <= ((:hourRangeEnd*100)+:minuteRangeEnd)
					)


					GROUP BY u.lang ORDER by count(t.id) desc;
					";
									
	$query_lang_s = "SELECT u.lang as name, count(t.id) as size
					FROM `tweets` as t
						INNER JOIN `users` as u ON u.id = t.user_id

					WHERE 
					
					(
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) >= ((:hourRangeStart*100)+:minuteRangeStart)
						OR 
						EXTRACT(HOUR_MINUTE FROM t.`created_at`) <= ((:hourRangeEnd*100)+:minuteRangeEnd)
					)


					GROUP BY u.lang ORDER by count(t.id) desc;
					";

		
	$db = new PDO('mysql:host=localhost;dbname=infoViz', 'info', 'viz');
	$stmt = $db->prepare($query_lang);				
	
	$passed = filter_input_array(INPUT_GET);
		
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
		print_r($stmt->errorInfo());
		echo json_encode(false);
		die();
	}
	
	
	$dataList = array();
	
	foreach($res as $r){
		$dataList[] = new Data($r['name'], array('count'=>$r['size']));
	}

	echo json_encode($dataList);
	die();

?>