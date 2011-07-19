<?php

	header("Content-type: text/javascript");
	header("Content-Disposition: inline;");

	$l = explode('&', filter_input(INPUT_GET, 'lang'));
	$i = 0;
	$langs = array();
	foreach($l as $a) {
	    $b = split('=', $a);
	    $langs[] = '"'.$b[0].'"';
	    $i++;
	}
	$query_lang = "SELECT `users`.`lang`,
							COUNT(`users`.`lang`) as cnt,
							EXTRACT(HOUR FROM `tweets`.`created_at`) as hour,
							FLOOR(EXTRACT(MINUTE FROM `tweets`.`created_at`)/10) as minute
						FROM `tweets`
							INNER JOIN `users`
								ON `users`.`id` = `tweets`.`user_id`
						WHERE 
						
							`users`.`lang` IN (".implode(',',$langs).")
						
						GROUP BY `users`.`lang`, hour, minute;
					";

		
	$db = new PDO('mysql:host=localhost;dbname=infoViz', 'info', 'viz');
	$stmt = $db->prepare($query_lang);				
	
	$stmt->execute($param);
	
	$res = $stmt->fetchAll();
	
	
	foreach( $res as $k=>$r ){
		unset($res[$k][0]);
		unset($res[$k][1]);
		unset($res[$k][2]);
		unset($res[$k][3]);
	}
	
	echo json_encode($res);

?>