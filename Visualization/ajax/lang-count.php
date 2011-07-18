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
	
	
	$query_lang = "SELECT u.lang as name, count(t.id) as size
					FROM `tweets` as t
						INNER JOIN `users` as u ON u.id = t.user_id

					WHERE 

					EXTRACT(HOUR FROM t.`created_at`) >= :hourRangeStart AND 
					EXTRACT(HOUR FROM t.`created_at`) <= :hourRangeEnd

					AND 

					EXTRACT(MINUTE FROM t.`created_at`) >= :minuteRangeStart AND
					EXTRACT(MINUTE FROM t.`created_at`) <= :minuteRangeEnd

					GROUP BY u.lang ORDER by count(t.id) desc;
					";

		
	$db = new PDO('mysql:host=localhost;dbname=infoViz', 'info', 'viz');
	$stmt = $db->prepare($query_lang);				
	
	$passed = filter_input_array(INPUT_GET);
		
	$param = array();
	$param['hourRangeStart'] 	= isset($passed['hs'])?$passed['hs']:0;
	$param['hourRangeEnd'] 		= isset($passed['he'])?$passed['he']:isset($passed['hs'])?$passed['hs']:24;
	$param['minuteRangeStart'] 	= isset($passed['ms'])?$passed['ms']:0;
	$param['minuteRangeEnd'] 	= isset($passed['me'])?$passed['me']:isset($passed['ms'])?($passed['ms']+15)%60:60;

	
	$stmt->execute($param);
	
	$res = $stmt->fetchAll();
	
	if ( !$res ){
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