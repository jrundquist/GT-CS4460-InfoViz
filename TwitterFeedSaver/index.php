<?php
	/*
	 *	Twitter Collector 
	 * 
	 *  Collects tweets from the incoming sample stream (1% of firehose) 
	 *  Stores tweets in database structure specified in scheme.sql 
	 * 
	 *  James Rundquist - james.k.rundquist@gmail.com
	 */


	// Define twitter credentials
	define('TWITTER_USERNAME', 'jamesrundquist');
	define('TWITTER_PASSWORD', '--password--');

	require_once("mapper.php");
	
	
	
	if ( !isset($_SERVER['SHELL']) )
		echo '<pre>';

	$opts = array(
		'http'=>array(
			'method'	=>	"POST"
		)
	);
	$context = stream_context_create($opts);
	
	
	// Convert errors to exceptions.. kinda bad, but an easy way to check for wrong username and password for twitter
	function handleError($errno, $errstr, $errfile, $errline, array $errcontext){
		// error was suppressed with the @-operator
	    if (0 === error_reporting()) {
	        return false;
	    }
		throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
	}
	// Set the error handler to our custom exception throwing handler
	set_error_handler('handleError');
	
	// Try to open the twitter stream using the context handler created above
	try{
		$instream = fopen('http://'.TWITTER_USERNAME.':'.TWITTER_PASSWORD.'@stream.twitter.com/1/statuses/sample.json','r' ,false, $context);
	}catch(Exception $e){
		if (substr($e->getMessage(),0,5) == 'fopen')
			die('Wrong Username and Password\n');
	}
	// Retore the error handler becuase presumably we caught the error we were looking for
	restore_error_handler();
	
	$sample_size = 2000000;	// A really big number
	$count = 0;
	
	// Main loop
	while(!feof($instream) && $count < $sample_size ) {
		if(! ($line = stream_get_line($instream, 20000, "\n"))) {
			continue;
		}else{
			$tweet = json_decode(utf8_encode($line));
			//print_r($tweet);
			if ( !is_object($tweet) || isset($tweet->{'delete'}) || $tweet->coordinates==NULL )
				continue;		
			//if ( $count % 10 == 0){
				Mapper::save($tweet);
			//	echo $count."\t".$tweet->user->screen_name."\t".$tweet->text."\n";
			//}
			if ( $count % 10 == 0){
				echo $count."\t".$tweet->user->screen_name."\t".$tweet->text."\n";
				flush();
			}
			$count++;
		}
	}
	fclose($instream);
	
	
	
	
	echo "-- EOF returned --\n\tEnding...\n";
	if ( !isset($_SERVER['SHELL']) )
		echo '</pre>';	
?>